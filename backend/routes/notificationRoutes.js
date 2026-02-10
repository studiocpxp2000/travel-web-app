const express = require('express');
const router = express.Router();
const {
    getNotifications,
    createNotification,
    deleteNotification,
    resetNotifications
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get Notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *   post:
 *     summary: Create Notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message]
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [info, warning, negative, positive, neutral]
 *     responses:
 *       201:
 *         description: Notification created
 */
router.get('/', protect, getNotifications);
router.post('/', protect, authorize('admin_org', 'super_admin'), createNotification);

/**
 * @swagger
 * /notifications/reset:
 *   delete:
 *     summary: Reset All Notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
router.delete('/reset', protect, authorize('admin_org', 'super_admin'), resetNotifications);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete Notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', protect, authorize('admin_org', 'super_admin'), deleteNotification);

module.exports = router;
