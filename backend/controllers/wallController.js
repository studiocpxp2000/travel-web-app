'use strict';

const WallPost = require('../models/WallPost');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getIO } = require('../config/socket');
const archiver = require('archiver');

// ─── Helper ──────────────────────────────────────────────────────────────────

const deleteFromS3 = async (key) => {
    try {
        if (!key) return;
        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        }));
    } catch (err) {
        // Log but don't throw — S3 errors should not block DB responses
        console.error('WallPost S3 delete error:', err.message);
    }
};

/**
 * Resolve org from request.
 * For regular users/admins: req.user.org_id is set.
 * For super_admin: reads org_slug from req.query or req.body.
 */
const resolveOrg = async (req) => {
    if (req.user.role === 'super_admin') {
        const slug = req.query.slug || req.query.org_slug || req.body?.org_slug;
        if (slug) {
            return await Organization.findOne({ slug }).lean();
        }
        if (req.body?.org_id) {
            return await Organization.findById(req.body.org_id).lean();
        }
        return null;
    }
    return await Organization.findById(req.user.org_id).lean();
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all Wall Posts for an org
 * @route   GET /api/wall?slug=:orgSlug
 * @access  Protected (user)
 */
exports.getWallPosts = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        // Feature gate — users see nothing if wall is off; super_admin and admin_org always see
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin_org' && !org.settings?.features?.wall_enabled) {
            return res.status(200).json({
                success: true,
                wall_enabled: false,
                wall_upload_enabled: false,
                count: 0,
                data: []
            });
        }

        const posts = await WallPost.find({ org_id: org._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            wall_enabled: org.settings?.features?.wall_enabled ?? false,
            wall_upload_enabled: org.settings?.features?.wall_upload_enabled ?? false,
            count: posts.length,
            data: posts
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Upload a Wall Post (camera capture → S3)
 * @route   POST /api/wall
 * @access  Protected (user)
 */
exports.uploadWallPost = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        // Feature gate — wall upload must be enabled
        if (!org.settings?.features?.wall_enabled) {
            return res.status(403).json({ success: false, message: 'Social Wall is not enabled for this event' });
        }
        if (!org.settings?.features?.wall_upload_enabled) {
            return res.status(403).json({ success: false, message: 'Image uploading is currently disabled' });
        }

        // Resolve uploader name from DB for the snapshot
        const userDoc = await User.findById(req.user.id).select('name').lean();
        const userName = userDoc?.name || req.user.name || 'Unknown';

        const post = await WallPost.create({
            org_id: org._id,
            user_id: req.user.id,
            user_name_snapshot: userName,
            imageUrl: req.file.location,
            s3_key: req.file.key
        });

        // Emit real-time event to org room
        try {
            const io = getIO();
            io.to(org.slug).emit('wall_post_new', post);
            io.to(`${org.slug}_admin`).emit('wall_post_new', post);
        } catch (socketErr) {
            console.error('Socket emit error (wall_post_new):', socketErr.message);
        }

        return res.status(201).json({ success: true, data: post });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Delete a Wall Post (admin/super_admin only)
 * @route   DELETE /api/wall/:id
 * @access  Protected (admin_org, super_admin)
 */
exports.deleteWallPost = async (req, res, next) => {
    try {
        const post = await WallPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Wall post not found' });
        }

        // Org-scope check for org admins
        if (req.user.role === 'admin_org' && String(post.org_id) !== String(req.user.org_id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const keyToDelete = post.s3_key;
        const orgId = post.org_id;
        const postId = post._id;

        await post.deleteOne();
        await deleteFromS3(keyToDelete);

        // Emit delete
        try {
            const io = getIO();
            const org = await Organization.findById(orgId).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('wall_post_deleted', postId);
                io.to(`${org.slug}_admin`).emit('wall_post_deleted', postId);
            }
        } catch (socketErr) {
            console.error('Socket emit error (wall_post_deleted):', socketErr.message);
        }

        return res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Toggle Social Wall feature settings
 * @route   PUT /api/wall/settings
 * @access  Protected (admin_org, super_admin)
 */
exports.toggleWallFeature = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        // Org-scope check for org admins
        if (req.user.role === 'admin_org' && String(org._id) !== String(req.user.org_id)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { wall_enabled, wall_upload_enabled } = req.body;
        const updateFields = {};

        if (typeof wall_enabled === 'boolean') {
            updateFields['settings.features.wall_enabled'] = wall_enabled;
        }
        if (typeof wall_upload_enabled === 'boolean') {
            updateFields['settings.features.wall_upload_enabled'] = wall_upload_enabled;
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid settings provided' });
        }

        const updatedOrg = await Organization.findByIdAndUpdate(
            org._id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).lean();

        const features = updatedOrg.settings?.features || {};

        // Emit settings change to all clients in this org room
        try {
            const io = getIO();
            const payload = {
                wall_enabled: features.wall_enabled,
                wall_upload_enabled: features.wall_upload_enabled
            };
            io.to(updatedOrg.slug).emit('wall_settings_changed', payload);
            io.to(`${updatedOrg.slug}_admin`).emit('wall_settings_changed', payload);
        } catch (socketErr) {
            console.error('Socket emit error (wall_settings_changed):', socketErr.message);
        }

        return res.status(200).json({
            success: true,
            data: {
                wall_enabled: features.wall_enabled,
                wall_upload_enabled: features.wall_upload_enabled
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Download wall post images as a ZIP
 * @route   POST /api/wall/download
 * @access  Protected (user, admin_org, super_admin)
 */
exports.downloadWallPosts = async (req, res, next) => {
    try {
        const { ids, org_id } = req.body;

        if (!org_id) {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        let query = { org_id };
        if (ids && Array.isArray(ids) && ids.length > 0) {
            query._id = { $in: ids };
        } else if (ids !== 'all') {
            return res.status(400).json({ success: false, message: 'Specify ids array or "all"' });
        }

        const items = await WallPost.find(query);
        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'No images found' });
        }

        res.attachment('wall-download.zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Zip failed' });
        });
        archive.pipe(res);

        for (const item of items) {
            try {
                const response = await fetch(item.imageUrl);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const name = item.imageUrl.split('/').pop() || `wall-${item._id}.jpg`;
                    archive.append(buffer, { name });
                }
            } catch (fetchErr) {
                console.error(`Failed to fetch ${item.imageUrl}:`, fetchErr);
            }
        }

        await archive.finalize();
    } catch (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Download process failed' });
        }
    }
};

/**
 * @desc    Admin multi-image upload to Wall
 * @route   POST /api/wall/admin-upload
 * @access  Protected (admin_org, super_admin)
 */
exports.adminUploadWallPosts = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        const org = await resolveOrg(req);
        if (!org) {
            return res.status(400).json({ success: false, message: 'Organization not found' });
        }

        const adminName = req.user.name || 'Admin';
        const createdPosts = [];

        const mongoose = require('mongoose');

        for (const file of req.files) {
            const postData = {
                org_id: org._id,
                user_name_snapshot: adminName,
                imageUrl: file.location,
                s3_key: file.key,
                is_moderator: true
            };

            if (mongoose.Types.ObjectId.isValid(req.user.id)) {
                postData.user_id = req.user.id;
            }

            const post = await WallPost.create(postData);
            createdPosts.push(post);
        }

        // Emit socket events for each new post
        try {
            const io = getIO();
            for (const post of createdPosts) {
                io.to(org.slug).emit('wall_post_new', post);
                io.to(`${org.slug}_admin`).emit('wall_post_new', post);
            }
        } catch (socketErr) {
            console.error('Socket emit error (admin wall_post_new):', socketErr.message);
        }

        return res.status(201).json({
            success: true,
            count: createdPosts.length,
            data: createdPosts
        });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Bulk delete Wall Posts (admin/super_admin only)
 * @route   POST /api/wall/delete
 * @access  Protected (admin_org, super_admin)
 */
exports.deleteWallPosts = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Provide an array of post IDs' });
        }

        const posts = await WallPost.find({ _id: { $in: ids } });
        if (posts.length === 0) {
            return res.status(404).json({ success: false, message: 'No matching posts found' });
        }

        // Org-scope check for org admins
        if (req.user.role === 'admin_org') {
            const unauthorized = posts.some(p => String(p.org_id) !== String(req.user.org_id));
            if (unauthorized) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete some of these posts' });
            }
        }

        // Gather S3 keys and org for socket
        const s3Keys = posts.map(p => p.s3_key).filter(Boolean);
        const orgId = posts[0].org_id;

        // Delete from DB
        await WallPost.deleteMany({ _id: { $in: ids } });

        // Delete from S3 in parallel
        await Promise.allSettled(s3Keys.map(key => deleteFromS3(key)));

        // Emit socket events
        try {
            const io = getIO();
            const org = await Organization.findById(orgId).select('slug').lean();
            if (org) {
                for (const post of posts) {
                    io.to(org.slug).emit('wall_post_deleted', post._id);
                }
            }
        } catch (socketErr) {
            console.error('Socket emit error (bulk wall_post_deleted):', socketErr.message);
        }

        return res.status(200).json({ success: true, count: posts.length });
    } catch (err) {
        next(err);
    }
};
