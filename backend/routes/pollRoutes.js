'use strict';

const express = require('express');
const router = express.Router();
const {
    getPolls,
    createPoll,
    votePoll,
    togglePollStatus,
    toggleLiveEngagementFeature,
    deletePoll,
    archivePoll,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    quizCallback
} = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');

// ─── Public (unauthenticated) ─────────────────────────────────────────────────

/**
 * Quiz score callback — called by external PHP quiz
 * Must be BEFORE protect middleware routes
 */
router.post('/quiz-callback', quizCallback);

// ─── Protected routes ─────────────────────────────────────────────────────────

/**
 * Feature toggle (must be BEFORE /:id to avoid route collision)
 */
router.put(
    '/feature',
    protect,
    authorize('admin_org', 'super_admin'),
    toggleLiveEngagementFeature
);

/**
 * Quiz CRUD (must be BEFORE /:id routes)
 */
router.route('/quizzes')
    .post(protect, authorize('admin_org', 'super_admin'), addQuiz);

router.route('/quizzes/:quizId')
    .put(protect, authorize('admin_org', 'super_admin'), updateQuiz)
    .delete(protect, authorize('admin_org', 'super_admin'), deleteQuiz);

/**
 * Get polls / Create a poll
 */
router.route('/')
    .get(protect, getPolls)
    .post(
        protect,
        authorize('admin_org', 'super_admin'),
        (req, res, next) => { req.uploadFolder = 'polls'; next(); },
        upload.array('images', 5),
        createPoll
    );

/**
 * Vote on a poll
 */
router.post('/:id/vote', protect, authorize('user'), votePoll);

/**
 * Toggle individual poll status
 */
router.put('/:id/status', protect, authorize('admin_org', 'super_admin'), togglePollStatus);

/**
 * Archive a poll
 */
router.put('/:id/archive', protect, authorize('admin_org', 'super_admin'), archivePoll);

/**
 * Delete a poll
 */
router.delete('/:id', protect, authorize('admin_org', 'super_admin'), deletePoll);

module.exports = router;
