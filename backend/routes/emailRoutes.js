const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    sendEmail,
    getSentEmails,
    getUnregisteredUsers,
    getSentEmailDetails
} = require('../controllers/emailController');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin_org', 'super_admin'));

// Email routes
router.route('/')
    .get(getSentEmails);

router.route('/send')
    .post(sendEmail);

router.route('/unregistered')
    .get(getUnregisteredUsers);

router.route('/:id')
    .get(getSentEmailDetails);

module.exports = router;
