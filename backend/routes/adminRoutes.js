const express = require('express');
const router = express.Router();
const {
    createOrganization,
    getOrganizations,
    createOrgAdmin,
    getDashboardStats
} = require('../controllers/adminController');
const { protect, authorize, protectSuperAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /admin/organizations:
 *   get:
 *     summary: Get all organizations (Super Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of organizations
 *   post:
 *     summary: Create new organization (Super Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               colors:
 *                 type: object
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Organization created
 */
router.post('/organizations', protect, protectSuperAdmin, createOrganization);
router.get('/organizations', protect, protectSuperAdmin, getOrganizations);

/**
 * @swagger
 * /admin/admins:
 *   post:
 *     summary: Create Org Admin (Super Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, org_id]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               org_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 */
router.post('/admins', protect, protectSuperAdmin, createOrgAdmin);

/**
 * @swagger
 * /admin/dashboard-stats:
 *   get:
 *     summary: Get Dashboard Stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats data
 */
router.get('/dashboard-stats', protect, authorize('admin_org', 'super_admin'), getDashboardStats);

module.exports = router;
