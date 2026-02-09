const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.router();

const {
    getMessages,
    sendMessage,
    replyMessage
} = require('../controllers/messageController');

router.use(protect); // All routes protected

router.route('/')
    .get(getMessages) // User sees their messages, Admin sees filtered messages
    .post(sendMessage); // User sends to Admin

// Admin only routes
router.post('/reply', authorize('admin_org', 'super_admin'), replyMessage);

module.exports = router;
