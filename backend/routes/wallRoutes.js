'use strict';

const express = require('express');
const router = express.Router();
const {
    getWallPosts,
    uploadWallPost,
    deleteWallPost,
    deleteWallPosts,
    toggleWallFeature,
    downloadWallPosts,
    adminUploadWallPosts
} = require('../controllers/wallController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');

/**
 * Wall settings toggle (must be BEFORE /:id to avoid route collision)
 * @access admin_org, super_admin
 */
router.put(
    '/settings',
    protect,
    authorize('admin_org', 'super_admin'),
    toggleWallFeature
);

/**
 * Download wall post images as ZIP
 * @access user, admin_org, super_admin
 */
router.post('/download', protect, downloadWallPosts);

/**
 * Bulk delete wall posts
 * @access admin_org, super_admin
 */
router.post('/delete', protect, authorize('admin_org', 'super_admin'), deleteWallPosts);

/**
 * Admin multi-image upload
 * @access admin_org, super_admin
 */
router.post(
    '/admin-upload',
    protect,
    authorize('admin_org', 'super_admin'),
    (req, res, next) => { req.uploadFolder = 'wall'; next(); },
    upload.array('images', 20),
    adminUploadWallPosts
);

/**
 * Get wall posts for an org (requires auth so we know who is viewing)
 * Upload a new wall post (camera image)
 * @access user, admin_org, super_admin
 */
router.route('/')
    .get(protect, (req, res, next) => {
        if (!['user', 'admin_org', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        next();
    }, getWallPosts)
    .post(protect, authorize('user'), (req, res, next) => {
        req.uploadFolder = 'wall';
        next();
    }, upload.single('image'), uploadWallPost);

/**
 * Delete — admin/super_admin only
 */
router.route('/:id')
    .delete(protect, authorize('admin_org', 'super_admin'), deleteWallPost);

module.exports = router;
