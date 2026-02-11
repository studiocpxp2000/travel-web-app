const express = require('express');
const router = express.Router();
const { protect, authorize, protectSuperAdmin } = require('../middleware/auth');
const {
    getPageContent,
    getAllOrgContent,
    updatePageContent,
    publishPageContent,
    unpublishPageContent,
    getContentForOrg,
    updateContentForOrg,
    getAllContentForOrg,
    uploadImage,
    deleteImage
} = require('../controllers/pageContentController');
const { upload } = require('../config/s3');

/**
 * @swagger
 * /admin/content/upload:
 *   post:
 *     summary: Upload content image to S3
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded, returns URL
 */
router.post('/upload', protect, authorize('admin_org', 'super_admin'), upload.single('file'), uploadImage);

/**
 * @swagger
 * /admin/content/delete-image:
 *   post:
 *     summary: Delete content image from S3
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image deleted
 */
router.post('/delete-image', protect, authorize('admin_org', 'super_admin'), deleteImage);

/**
 * @swagger
 * /admin/content:
 *   get:
 *     summary: Get all page content for organization
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All page content
 */
router.get('/', protect, authorize('admin_org', 'super_admin'), getAllOrgContent);

/**
 * @swagger
 * /admin/content/{pageType}:
 *   get:
 *     summary: Get content for a specific page
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, agenda, venue, faq, funzone, helpdesk]
 *     responses:
 *       200:
 *         description: Page content
 *   put:
 *     summary: Update content for a specific page
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [home, agenda, venue, faq, funzone, helpdesk]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: Content updated
 */
router.get('/:pageType', protect, authorize('admin_org', 'super_admin'), getPageContent);
router.put('/:pageType', protect, authorize('admin_org', 'super_admin'), updatePageContent);

/**
 * @swagger
 * /admin/content/{pageType}/publish:
 *   post:
 *     summary: Publish page content
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content published
 */
router.post('/:pageType/publish', protect, authorize('admin_org', 'super_admin'), publishPageContent);

/**
 * @swagger
 * /admin/content/{pageType}/unpublish:
 *   post:
 *     summary: Unpublish page content
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Content unpublished
 */
router.post('/:pageType/unpublish', protect, authorize('admin_org', 'super_admin'), unpublishPageContent);

// =========================
// SUPER ADMIN - Organization-specific content management
// =========================

/**
 * @swagger
 * /admin/organizations/{orgId}/content:
 *   get:
 *     summary: Get all content for a specific organization (Super Admin)
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All page content for org
 */
router.get('/organizations/:orgId/content', protect, protectSuperAdmin, getAllContentForOrg);

/**
 * @swagger
 * /admin/organizations/{orgId}/content/{pageType}:
 *   get:
 *     summary: Get content for a specific page of an organization (Super Admin)
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Page content
 *   put:
 *     summary: Update content for a specific page of an organization (Super Admin)
 *     tags: [Page Content]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pageType
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *               publish:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Content updated
 */
router.get('/organizations/:orgId/content/:pageType', protect, protectSuperAdmin, getContentForOrg);
router.put('/organizations/:orgId/content/:pageType', protect, protectSuperAdmin, updateContentForOrg);

module.exports = router;
