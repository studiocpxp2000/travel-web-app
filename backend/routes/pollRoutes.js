'use strict';

const express = require('express');
const router = express.Router();
const {
    getPolls,
    createPoll,
    votePoll,
    togglePollStatus,
    togglePollsFeature,
    deletePoll
} = require('../controllers/pollController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');

/**
 * Feature toggle (must be BEFORE /:id to avoid route collision)
 * @access admin_org, super_admin
 */
router.put(
    '/feature',
    protect,
    authorize('admin_org', 'super_admin'),
    togglePollsFeature
);

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
 * @access user
 */
router.post('/:id/vote', protect, authorize('user'), votePoll);

/**
 * Toggle individual poll status
 * @access admin_org, super_admin
 */
router.put('/:id/status', protect, authorize('admin_org', 'super_admin'), togglePollStatus);

/**
 * Delete a poll
 * @access admin_org, super_admin
 */
router.delete('/:id', protect, authorize('admin_org', 'super_admin'), deletePoll);

module.exports = router;
