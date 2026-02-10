const express = require('express');
const router = express.Router();
const {
    uploadGalleryItem,
    getGalleryItems,
    deleteGalleryItem,
    deleteGalleryItems,
    downloadGalleryItems
} = require('../controllers/galleryController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3'); // Multer config

/**
 * @swagger
 * /gallery:
 *   get:
 *     summary: Get Gallery Items
 *     tags: [Gallery]
 *     parameters:
 *       - in: query
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of items
 *   post:
 *     summary: Upload Gallery Item (Admin)
 *     tags: [Gallery]
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
 *       201:
 *         description: Upload successful
 */
router.route('/')
    .post(protect, authorize('admin_org', 'super_admin'), upload.single('file'), uploadGalleryItem)
    .get(getGalleryItems);

/**
 * @swagger
 * /gallery/delete:
 *   post:
 *     summary: Bulk Delete Gallery Items
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Items deleted
 */
router.post('/delete', protect, authorize('admin_org', 'super_admin'), deleteGalleryItems);

/**
 * @swagger
 * /gallery/download:
 *   post:
 *     summary: Download Gallery Items (Zip)
 *     tags: [Gallery]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               org_id:
 *                 type: string
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Zip file download
 */
router.post('/download', downloadGalleryItems);

/**
 * @swagger
 * /gallery/{id}:
 *   delete:
 *     summary: Delete Gallery Item
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.delete('/:id', protect, authorize('admin_org', 'super_admin'), deleteGalleryItem);

module.exports = router;
