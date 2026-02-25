const GalleryItem = require('../models/GalleryItem');
const Organization = require('../models/Organization');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getIO } = require('../config/socket');
const archiver = require('archiver');

// @desc    Upload Gallery Item (Admin)
// @route   POST /api/gallery
// @access  Admin
exports.uploadGalleryItem = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        let orgId = req.user.org_id;

        // Handle Super Admin Masquerading
        if (req.user.role === 'super_admin') {
            // Frontend sends org_slug in body
            if (req.body.org_slug) {
                const org = await Organization.findOne({ slug: req.body.org_slug });
                if (org) orgId = org._id;
            } else if (req.body.org_id) {
                orgId = req.body.org_id;
            }
        }

        if (!orgId) {
            return res.status(400).json({ success: false, message: 'Organization Context Missing' });
        }

        const galleryData = {
            org_id: orgId,
            url: req.file.location, // S3 URL from multer-s3
            type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
        };

        // Only set uploadedBy if it's a valid ObjectId (Admin/Promoter)
        // Super Admin uses static string ID, so we skip setting it or could set a flag
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(req.user.id)) {
            galleryData.uploadedBy = req.user.id;
        }

        const newItem = await GalleryItem.create(galleryData);

        // Emit Socket Event
        try {
            const io = getIO();
            const org = await Organization.findById(orgId).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('gallery_update', newItem);
                io.to(`${org.slug}_admin`).emit('gallery_update', newItem);
            }
        } catch (socketErr) {
            console.error('Socket Emit Error:', socketErr);
        }

        res.status(201).json({ success: true, data: newItem });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Gallery Items (Public)
// @route   GET /api/gallery
// @access  Public
exports.getGalleryItems = async (req, res, next) => {
    try {
        const { org_id, slug } = req.query;
        let targetOrgId = org_id;

        if (!targetOrgId && slug) {
            const org = await Organization.findOne({ slug });
            if (org) targetOrgId = org._id;
        }

        if (!targetOrgId) return res.status(400).json({ success: false, message: 'Org ID or Slug required' });

        const items = await GalleryItem.find({ org_id: targetOrgId }).sort({ createdAt: -1 });
        res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=5');
        res.status(200).json({ success: true, count: items.length, data: items });
    } catch (err) {
        next(err);
    }
};

// Helper to delete from S3
const deleteFromS3 = async (url) => {
    try {
        if (!url || !url.includes('amazonaws.com')) return; // Only delete if it's an S3 URL

        // Extract key from URL
        // URL format: https://[bucket].s3.[region].amazonaws.com/[key]
        const urlParts = url.split('.com/');
        if (urlParts.length < 2) return;
        const key = decodeURIComponent(urlParts[1]);

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });

        await s3.send(command);
        // console.log(`Successfully deleted from S3: ${key}`);
    } catch (err) {
        console.error('Error deleting from S3:', err);
        // We don't throw here to avoid failing the DB deletion if S3 fails (e.g. file already gone)
    }
};

// @desc    Delete Gallery Item
// @route   DELETE /api/gallery/:id
// @access  Admin
exports.deleteGalleryItem = async (req, res, next) => {
    try {
        const item = await GalleryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

        // Allow if user is super_admin OR if user owns the org
        if (req.user.role !== 'super_admin') {
            if (item.org_id.toString() !== req.user.org_id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        }

        const urlToDelete = item.url;
        await item.deleteOne();

        // Delete from S3
        await deleteFromS3(urlToDelete);

        // Emit Socket Event
        try {
            const io = getIO();
            const org = await Organization.findById(item.org_id).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('gallery_delete', item._id);
                io.to(`${org.slug}_admin`).emit('gallery_delete', item._id);
            }
        } catch (e) { }

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Bulk Delete Gallery Items
// @route   POST /api/gallery/delete
// @access  Admin
exports.deleteGalleryItems = async (req, res, next) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No IDs provided' });
        }

        let query = { _id: { $in: ids } };
        // If not super admin, restrict to their org
        if (req.user.role !== 'super_admin') {
            query.org_id = req.user.org_id;
        }

        // Find items belonging to this org (or all if super admin)
        const items = await GalleryItem.find(query);

        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'No items found matching criteria' });
        }

        const deletedIds = items.map(item => item._id);
        const urlsToDelete = items.map(item => item.url);

        // Use first item's org for socket notification (assuming bulk delete is within one org usually)
        // If super admin deletes across orgs, this might only notify one, but that's edge case.
        const orgId = items[0].org_id;

        // Delete from DB
        await GalleryItem.deleteMany({
            _id: { $in: deletedIds }
        });

        // Delete from S3 in parallel
        await Promise.all(urlsToDelete.map(url => deleteFromS3(url)));

        // Socket emit
        try {
            const io = getIO();
            const org = await Organization.findById(orgId).select('slug').lean();
            if (org) {
                io.to(org.slug).emit('gallery_delete_bulk', deletedIds);
                io.to(`${org.slug}_admin`).emit('gallery_delete_bulk', deletedIds);
            }
        } catch (e) {
            // Silently handle socket errors to avoid blocking the response
        }

        res.status(200).json({ success: true, count: deletedIds.length, data: deletedIds });
    } catch (err) {
        next(err);
    }
};

// @desc    Download Gallery Items (Zip)
// @route   POST /api/gallery/download
// @access  Public (with org_id) or Admin
exports.downloadGalleryItems = async (req, res, next) => {
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

        const items = await GalleryItem.find(query);
        if (items.length === 0) {
            return res.status(404).json({ success: false, message: 'No images found' });
        }

        res.attachment('gallery-download.zip');

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        archive.on('error', function (err) {
            console.error('Archiver error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Zip failed' });
        });

        archive.pipe(res);

        // Fetch and append files
        for (const item of items) {
            try {
                const response = await fetch(item.url);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const name = item.url.split('/').pop() || `image-${item._id}.jpg`;
                    archive.append(buffer, { name });
                }
            } catch (fetchErr) {
                console.error(`Failed to fetch ${item.url}:`, fetchErr);
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
