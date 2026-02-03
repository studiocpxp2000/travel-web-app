const express = require('express');
const router = express.Router();
const { scanUser, getPromoterStats } = require('../controllers/promoterController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /promoter/scan:
 *   post:
 *     summary: Scan a User QR Code
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qr_data]
 *             properties:
 *               qr_data:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scan successful
 *       400:
 *         description: Invalid QR
 */
router.post('/scan', protect, authorize('promoter'), scanUser);

/**
 * @swagger
 * /promoter/stats:
 *   get:
 *     summary: Get Promoter Stats
 *     tags: [Promoter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats data
 */
router.get('/stats', protect, authorize('promoter'), getPromoterStats);

module.exports = router;
