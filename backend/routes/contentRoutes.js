const express = require('express');
const router = express.Router();
const {
    updateAgenda,
    getAgenda
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * /content/agenda:
 *   get:
 *     summary: Get Agenda
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: org_id
 *         required: true
 *     responses:
 *       200:
 *         description: Agenda data
 *   put:
 *     summary: Update Agenda (Admin)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Agenda updated
 */
router.route('/agenda')
    .put(protect, authorize('admin_org', 'super_admin'), updateAgenda)
    .get(getAgenda);

module.exports = router;
