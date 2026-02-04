const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
    getNotifications,
    createNotification
} = require('../controllers/communicationController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /communication/messages/{userId}:
 *   get:
 *     summary: Get Messages for User
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *     responses:
 *       200:
 *         description: Message history
 */
router.get('/messages/:userId', protect, getMessages);

/**
 * @swagger
 * /communication/conversations:
 *   get:
 *     summary: Get All Conversations (Admin)
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
const { getAllConversations } = require('../controllers/communicationController');
router.get('/conversations', protect, authorize('admin_org', 'super_admin'), getAllConversations);

/**
 * @swagger
 * /communication/messages:
 *   post:
 *     summary: Send Message
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               user_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/messages', protect, sendMessage);

/**
 * @swagger
 * /communication/notifications:
 *   get:
 *     summary: Get Notifications
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *   post:
 *     summary: Create Notification (Admin)
 *     tags: [Communication]
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
router.get('/notifications', protect, getNotifications);
router.post('/notifications', protect, authorize('admin_org'), createNotification);

/**
 * @swagger
 * /communication/email:
 *   post:
 *     summary: Send Email (Admin)
 *     tags: [Communication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, subject, htmlContent]
 *             properties:
 *               to:
 *                 type: array
 *                 items:
 *                   type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlContent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 */
const { sendEmail } = require('../controllers/communicationController');
router.post('/email', protect, authorize('admin_org'), sendEmail);

module.exports = router;
