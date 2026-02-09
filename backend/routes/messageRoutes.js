const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

const {
    getMessages,
    sendMessage,
    replyMessage,
    getConversations,
    resetMessages
} = require('../controllers/messageController');

router.use(protect);

router.route('/')
    .get(getMessages)
    .post(sendMessage);

// Admin only routes
router.get('/conversations', authorize('admin_org', 'super_admin'), getConversations);
router.post('/reply', authorize('admin_org', 'super_admin'), replyMessage);
router.delete('/reset', authorize('admin_org', 'super_admin'), resetMessages);

module.exports = router;
