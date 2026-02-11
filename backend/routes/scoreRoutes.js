const express = require('express');
const router = express.Router();
const {
    getLeaderboard,
    redeemBonusCode,
    createBonusCode,
    getBonusCodes,
    toggleBonusCode,
    deleteBonusCode,
    getAdminLeaderboard,
    updateScore,
    deleteScore,
    getMyScore
} = require('../controllers/scoreController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /scores/leaderboard:
 *   get:
 *     summary: Get Leaderboard
 *     tags: [Scores]
 *     parameters:
 *       - in: query
 *         name: org_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of top users
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @swagger
 * /scores/my-score:
 *   get:
 *     summary: Get My Score
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User score
 */
router.get('/my-score', protect, authorize('user'), getMyScore);

/**
 * @swagger
 * /scores/redeem:
 *   post:
 *     summary: Redeem a Bonus Code
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Points added
 */
router.post('/redeem', protect, authorize('user'), redeemBonusCode);

/**
 * @swagger
 * /scores/codes:
 *   get:
 *     summary: Get all bonus codes (Admin)
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of codes
 *   post:
 *     summary: Create new bonus code
 *     tags: [Scores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, points]
 *             properties:
 *               code:
 *                 type: string
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Code created
 */
router.route('/codes')
    .post(protect, authorize('admin_org', 'super_admin'), createBonusCode)
    .get(protect, authorize('admin_org', 'super_admin'), getBonusCodes);

router.put('/codes/:id/toggle', protect, authorize('admin_org', 'super_admin'), toggleBonusCode);
router.delete('/codes/:id', protect, authorize('admin_org', 'super_admin'), deleteBonusCode);

// Admin Leaderboard Management
router.get('/admin/leaderboard', protect, authorize('admin_org', 'super_admin'), getAdminLeaderboard);
router.route('/admin/:id')
    .put(protect, authorize('admin_org', 'super_admin'), updateScore)
    .delete(protect, authorize('admin_org', 'super_admin'), deleteScore);

module.exports = router;
