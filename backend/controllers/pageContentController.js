const PageContent = require('../models/PageContent');
const Organization = require('../models/Organization');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Content Validators
 * Validates structure of content for each page type
 */
const validators = {
    home: (content) => {
        if (content.heroText !== undefined && typeof content.heroText !== 'string') {
            throw new Error('heroText must be a string');
        }
        if (content.countdownDate && isNaN(Date.parse(content.countdownDate))) {
            throw new Error('Invalid countdownDate format');
        }
        if (content.cards !== undefined && !Array.isArray(content.cards)) {
            throw new Error('cards must be an array');
        }
        if (content.cards) {
            content.cards.forEach((card, idx) => {
                if (!card.id) throw new Error(`Card at index ${idx} missing id`);
            });
        }
        return true;
    },
    agenda: (content) => {
        if (content.heroText !== undefined && typeof content.heroText !== 'string') {
            throw new Error('heroText must be a string');
        }
        if (content.days !== undefined && !Array.isArray(content.days)) {
            throw new Error('days must be an array');
        }
        if (content.days) {
            content.days.forEach((day, dayIdx) => {
                if (!day.id) throw new Error(`Day at index ${dayIdx} missing id`);
                if (!day.title) throw new Error(`Day at index ${dayIdx} missing title`);
                if (day.events && !Array.isArray(day.events)) {
                    throw new Error(`Day ${day.title} events must be an array`);
                }
            });
        }
        return true;
    },
    venue: (content) => {
        if (content.eventVenue && typeof content.eventVenue !== 'object') {
            throw new Error('eventVenue must be an object');
        }
        if (content.accommodation && typeof content.accommodation !== 'object') {
            throw new Error('accommodation must be an object');
        }
        if (content.inclusions && !Array.isArray(content.inclusions)) {
            throw new Error('inclusions must be an array');
        }
        if (content.exclusions && !Array.isArray(content.exclusions)) {
            throw new Error('exclusions must be an array');
        }
        return true;
    },
    faq: (content) => {
        if (content.items !== undefined && !Array.isArray(content.items)) {
            throw new Error('items must be an array');
        }
        if (content.items) {
            content.items.forEach((item, idx) => {
                if (!item.id) throw new Error(`FAQ item at index ${idx} missing id`);
                if (!item.question) throw new Error(`FAQ item at index ${idx} missing question`);
            });
        }
        return true;
    },
    funzone: (content) => {
        if (content.activities !== undefined && !Array.isArray(content.activities)) {
            throw new Error('activities must be an array');
        }
        if (content.activities) {
            content.activities.forEach((activity, idx) => {
                if (!activity.id) throw new Error(`Activity at index ${idx} missing id`);
                if (!activity.title) throw new Error(`Activity at index ${idx} missing title`);
            });
        }
        return true;
    },
    helpdesk: (content) => {
        if (content.phone !== undefined && typeof content.phone !== 'string') {
            throw new Error('phone must be a string');
        }
        if (content.email !== undefined && typeof content.email !== 'string') {
            throw new Error('email must be a string');
        }
        return true;
    }
};

const validateContent = (pageType, content) => {
    const validator = validators[pageType];
    if (!validator) {
        throw new Error(`Unknown page type: ${pageType}`);
    }
    return validator(content);
};

/**
 * Get page content for admin (draft or published)
 * @route GET /api/admin/content/:pageType
 * @access Admin, Super Admin
 */
exports.getPageContent = async (req, res) => {
    try {
        const { pageType } = req.params;
        const orgId = req.user.org_id;

        if (!orgId && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        // For regular admins, use their org_id
        const queryOrgId = orgId;

        let pageContent = await PageContent.findOne({ org_id: queryOrgId, pageType });

        if (!pageContent) {
            // Return default content if none exists
            const defaultContent = PageContent.getDefaultContent(pageType);
            return res.json({
                success: true,
                data: {
                    pageType,
                    content: defaultContent,
                    isPublished: false,
                    version: 0,
                    isDefault: true
                }
            });
        }

        res.json({
            success: true,
            data: pageContent
        });
    } catch (error) {
        console.error('getPageContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all page content for an organization (admin)
 * @route GET /api/admin/content
 * @access Admin, Super Admin
 */
exports.getAllOrgContent = async (req, res) => {
    try {
        const orgId = req.user.org_id;

        if (!orgId && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        const pageTypes = ['home', 'agenda', 'venue', 'faq', 'funzone', 'helpdesk'];
        const contentMap = {};

        const existingContent = await PageContent.find({ org_id: orgId });

        pageTypes.forEach(pageType => {
            const found = existingContent.find(c => c.pageType === pageType);
            if (found) {
                contentMap[pageType] = found;
            } else {
                contentMap[pageType] = {
                    pageType,
                    content: PageContent.getDefaultContent(pageType),
                    isPublished: false,
                    version: 0,
                    isDefault: true
                };
            }
        });

        res.json({
            success: true,
            data: contentMap
        });
    } catch (error) {
        console.error('getAllOrgContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update page content (save draft)
 * @route PUT /api/admin/content/:pageType
 * @access Admin, Super Admin
 */
exports.updatePageContent = async (req, res) => {
    try {
        const { pageType } = req.params;
        const { content } = req.body;
        const orgId = req.user.org_id;

        if (!orgId && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        // Validate content structure
        try {
            validateContent(pageType, content);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        let pageContent = await PageContent.findOne({ org_id: orgId, pageType });

        if (pageContent) {
            pageContent.content = content;
            pageContent.lastModifiedBy = req.user._id;
            await pageContent.save();
        } else {
            pageContent = await PageContent.create({
                org_id: orgId,
                pageType,
                content,
                lastModifiedBy: req.user._id,
                isPublished: false
            });
        }

        res.json({
            success: true,
            message: 'Content saved successfully',
            data: pageContent
        });
    } catch (error) {
        console.error('updatePageContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Publish page content (make visible on public pages)
 * @route POST /api/admin/content/:pageType/publish
 * @access Admin, Super Admin
 */
exports.publishPageContent = async (req, res) => {
    try {
        const { pageType } = req.params;
        const orgId = req.user.org_id;

        if (!orgId && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        const pageContent = await PageContent.findOne({ org_id: orgId, pageType });

        if (!pageContent) {
            return res.status(404).json({ success: false, message: 'No content found to publish. Save content first.' });
        }

        pageContent.isPublished = true;
        pageContent.lastModifiedBy = req.user._id;
        await pageContent.save();

        res.json({
            success: true,
            message: `${pageType} content published successfully`,
            data: pageContent
        });
    } catch (error) {
        console.error('publishPageContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Unpublish page content
 * @route POST /api/admin/content/:pageType/unpublish
 * @access Admin, Super Admin
 */
exports.unpublishPageContent = async (req, res) => {
    try {
        const { pageType } = req.params;
        const orgId = req.user.org_id;

        if (!orgId && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        const pageContent = await PageContent.findOne({ org_id: orgId, pageType });

        if (!pageContent) {
            return res.status(404).json({ success: false, message: 'No content found' });
        }

        pageContent.isPublished = false;
        await pageContent.save();

        res.json({
            success: true,
            message: `${pageType} content unpublished`,
            data: pageContent
        });
    } catch (error) {
        console.error('unpublishPageContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================
// PUBLIC ENDPOINTS
// =========================

/**
 * Get published page content for public viewing
 * @route GET /api/public/:orgSlug/content/:pageType
 * @access Public
 */
exports.getPublicPageContent = async (req, res) => {
    try {
        const { orgSlug, pageType } = req.params;

        // Find organization by slug
        const org = await Organization.findOne({ slug: orgSlug });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const pageContent = await PageContent.findOne({
            org_id: org._id,
            pageType,
            isPublished: true
        });

        if (!pageContent) {
            // Return default content for public pages
            const defaultContent = PageContent.getDefaultContent(pageType);
            res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
            return res.json({
                success: true,
                data: {
                    pageType,
                    content: defaultContent,
                    isDefault: true
                }
            });
        }

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
        res.json({
            success: true,
            data: {
                pageType: pageContent.pageType,
                content: pageContent.content,
                updatedAt: pageContent.updatedAt
            }
        });
    } catch (error) {
        console.error('getPublicPageContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all published content for an organization (public)
 * @route GET /api/public/:orgSlug/content
 * @access Public
 */
exports.getAllPublicContent = async (req, res) => {
    try {
        const { orgSlug } = req.params;

        const org = await Organization.findOne({ slug: orgSlug });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const pageTypes = ['home', 'agenda', 'venue', 'faq', 'funzone', 'helpdesk'];
        const contentMap = {};

        const publishedContent = await PageContent.find({
            org_id: org._id,
            isPublished: true
        });

        pageTypes.forEach(pageType => {
            const found = publishedContent.find(c => c.pageType === pageType);
            if (found) {
                contentMap[pageType] = {
                    content: found.content,
                    updatedAt: found.updatedAt
                };
            } else {
                contentMap[pageType] = {
                    content: PageContent.getDefaultContent(pageType),
                    isDefault: true
                };
            }
        });

        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=15');
        res.json({
            success: true,
            data: contentMap
        });
    } catch (error) {
        console.error('getAllPublicContent error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================
// SUPER ADMIN ENDPOINTS
// =========================

/**
 * Get content for a specific organization (Super Admin)
 * @route GET /api/admin/organizations/:orgId/content/:pageType
 * @access Super Admin
 */
exports.getContentForOrg = async (req, res) => {
    try {
        const { orgId, pageType } = req.params;

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        let pageContent = await PageContent.findOne({ org_id: orgId, pageType });

        if (!pageContent) {
            const defaultContent = PageContent.getDefaultContent(pageType);
            return res.json({
                success: true,
                data: {
                    pageType,
                    content: defaultContent,
                    isPublished: false,
                    version: 0,
                    isDefault: true,
                    organization: { id: org._id, name: org.name, slug: org.slug }
                }
            });
        }

        res.json({
            success: true,
            data: {
                ...pageContent.toObject(),
                organization: { id: org._id, name: org.name, slug: org.slug }
            }
        });
    } catch (error) {
        console.error('getContentForOrg error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update content for a specific organization (Super Admin)
 * @route PUT /api/admin/organizations/:orgId/content/:pageType
 * @access Super Admin
 */
exports.updateContentForOrg = async (req, res) => {
    try {
        const { orgId, pageType } = req.params;
        const { content, publish } = req.body;

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Validate content structure
        try {
            validateContent(pageType, content);
        } catch (validationError) {
            return res.status(400).json({ success: false, message: validationError.message });
        }

        let pageContent = await PageContent.findOne({ org_id: orgId, pageType });

        if (pageContent) {
            pageContent.content = content;
            pageContent.lastModifiedBy = req.user._id;
            if (publish !== undefined) {
                pageContent.isPublished = publish;
            }
            await pageContent.save();
        } else {
            pageContent = await PageContent.create({
                org_id: orgId,
                pageType,
                content,
                lastModifiedBy: req.user._id,
                isPublished: publish || false
            });
        }

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: pageContent
        });
    } catch (error) {
        console.error('updateContentForOrg error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all content for all pages for a specific organization (Super Admin)
 * @route GET /api/admin/organizations/:orgId/content
 * @access Super Admin
 */
exports.getAllContentForOrg = async (req, res) => {
    try {
        const { orgId } = req.params;

        const org = await Organization.findById(orgId);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const pageTypes = ['home', 'agenda', 'venue', 'faq', 'funzone', 'helpdesk'];
        const contentMap = {};

        const existingContent = await PageContent.find({ org_id: orgId });

        pageTypes.forEach(pageType => {
            const found = existingContent.find(c => c.pageType === pageType);
            if (found) {
                contentMap[pageType] = found;
            } else {
                contentMap[pageType] = {
                    pageType,
                    content: PageContent.getDefaultContent(pageType),
                    isPublished: false,
                    version: 0,
                    isDefault: true
                };
            }
        });

        res.json({
            success: true,
            data: contentMap
        });
    } catch (error) {
        console.error('getAllContentForOrg error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =========================
// ASSET MANAGEMENT
// =========================

/**
 * Upload an image for page content (S3)
 * Returns the URL without saving to PageContent DB (Frontend adds it to JSON)
 * @route POST /api/admin/content/upload
 * @access Admin, Super Admin
 */
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Multer-S3 already uploaded it and put the location in req.file.location
        res.json({
            success: true,
            url: req.file.location
        });
    } catch (error) {
        console.error('uploadImage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete an image from S3
 * @route POST /api/admin/content/delete-image
 * @access Admin, Super Admin
 */
exports.deleteImage = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, message: 'URL is required' });
        }

        // Validate it's an S3 URL to prevent arbitrary deletions
        if (!url.includes(process.env.AWS_BUCKET_NAME) && !url.includes('amazonaws.com')) {
            // If it's not our S3 bucket, just return success (maybe it was base64 or external)
            // or error if strict. Let's just return to allow UI to proceed.
            return res.json({ success: true, message: 'Not an S3 URL, skipped' });
        }

        // Extract key
        // Format: https://bucket.s3.region.amazonaws.com/key
        const urlParts = url.split('.com/');
        if (urlParts.length < 2) {
            return res.json({ success: true, message: 'Invalid URL format, skipped' });
        }
        const key = decodeURIComponent(urlParts[1]);

        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        });

        await s3.send(command);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('deleteImage error:', error);
        // Don't error out the client if S3 delete fails (e.g. file missing), just log it
        res.json({ success: true, message: 'Clean up attempted' });
    }
};
