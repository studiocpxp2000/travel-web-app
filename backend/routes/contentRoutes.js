const express = require('express');
const router = express.Router();
const {
    uploadGalleryItem,
    getGalleryItems,
    deleteGalleryItem,
    updateAgenda,
    getAgenda
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3'); // Multer config

/**
 * @swagger
 * /content/gallery:
 *   get:
 *     summary: Get Gallery Items
 *     tags: [Content]
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
 *     tags: [Content]
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
router.route('/gallery')
    .post(protect, authorize('admin_org'), upload.single('file'), uploadGalleryItem)
    .get(getGalleryItems);

/**
 * @swagger
 * /content/gallery/{id}:
 *   delete:
 *     summary: Delete Gallery Item
 *     tags: [Content]
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
router.delete('/gallery/:id', protect, authorize('admin_org'), deleteGalleryItem);

/**
 * @swagger
 * /content/agenda:
 *   get:
 *     summary: Get Agenda
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: org_id
 *         required: true
 *     responses:
 *       200:
 *         description: Agenda data
 *   put:
 *     summary: Update Agenda (Admin)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Agenda updated
 */
router.route('/agenda')
    .put(protect, authorize('admin_org'), updateAgenda)
    .get(getAgenda);

module.exports = router;
