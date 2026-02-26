const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

const {
    getSettings,
    updateSettings,
    getResponses,
    downloadReport,
    getPublicForm,
    submitFeedback,
    updateFeedback,
    deleteFeedback
} = require('../controllers/feedbackController');

// ─── ADMIN ROUTES (Protected) ───────────────────────────────────────────────
// Requires user to be logged in and authorized as admin or super_admin
// org_id resolution is handled inside the controller functions

router.get('/admin/settings', protect, authorize('admin_org', 'super_admin'), getSettings);
router.put('/admin/settings', protect, authorize('admin_org', 'super_admin'), updateSettings);

router.get('/admin/responses', protect, authorize('admin_org', 'super_admin'), getResponses);
router.put('/admin/responses/:id', protect, authorize('admin_org', 'super_admin'), updateFeedback);
router.delete('/admin/responses/:id', protect, authorize('admin_org', 'super_admin'), deleteFeedback);

router.get('/admin/download', protect, authorize('admin_org', 'super_admin'), downloadReport);


// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

router.get('/public/:org_slug', getPublicForm);
router.post('/public/:org_slug/submit', submitFeedback);

module.exports = router;
