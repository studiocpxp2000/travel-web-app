const express = require('express');
const router = express.Router();
const {
    createOrganization,
    getOrganizations,
    updateOrganization,
    deleteOrganization,
    createOrgAdmin,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getPromoters,
    createPromoter,
    updatePromoter,
    deletePromoter,
    getDashboardStats,
    getOrganizationBySlug,
    getOrganizationById,
    getPublicOrganizations,
    getRegistrationFields,
    updateRegistrationFields
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
router.get('/organizations/:id', protect, authorize('admin_org', 'super_admin'), getOrganizationById); // Fetch by ID
router.put('/organizations/:id', protect, protectSuperAdmin, updateOrganization);
router.delete('/organizations/:id', protect, authorize('super_admin'), deleteOrganization); // Added delete route for organizations
router.get('/public/organizations/:slug', getOrganizationBySlug); // Public route
// Duplicate route removed
router.get('/public/organizations/:slug', getOrganizationBySlug); // Public route
router.get('/public/organizations', getPublicOrganizations); // Public route

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
router.get('/admins', protect, protectSuperAdmin, getAllAdmins);
router.put('/admins/:id', protect, protectSuperAdmin, updateAdmin);
router.delete('/admins/:id', protect, protectSuperAdmin, deleteAdmin);

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

/**
 * @swagger
 * /admin/promoters:
 *   get:
 *     summary: Get All Promoters (Admin Org)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promoters
 *   post:
 *     summary: Create Promoter (Admin Org)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, scanner_type]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               scanner_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Promoter created
 */
// Duplicate import removed

router.get('/promoters', protect, authorize('admin_org', 'super_admin'), getPromoters);
router.post('/promoters', protect, authorize('admin_org', 'super_admin'), createPromoter);
router.put('/promoters/:id', protect, authorize('admin_org', 'super_admin'), updatePromoter);
router.delete('/promoters/:id', protect, authorize('admin_org', 'super_admin'), deletePromoter);

// Registration Fields Routes (Admin Org)
router.get('/registration-fields', protect, authorize('admin_org', 'super_admin'), getRegistrationFields);
router.put('/registration-fields', protect, authorize('admin_org', 'super_admin'), updateRegistrationFields);

module.exports = router;
