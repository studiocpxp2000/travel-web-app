const express = require('express');
const router = express.Router();
const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateProfile,
    generateMissingQRCodes,
    proxyDownloadQR,
    downloadGovtId,
    updateLocation
} = require('../controllers/userController');
const { uploadGovtId, addBooking, deleteBooking } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/s3');

// Public/User Routes
router.put('/profile/me', protect, authorize('user'), updateProfile);
router.post('/location', protect, authorize('user'), updateLocation);

// Generate missing QR codes
router.post('/generate-missing-qr', protect, authorize('admin_org', 'super_admin'), generateMissingQRCodes);

// File Upload Routes
router.put('/:id/govt-id', protect, authorize('admin_org', 'super_admin'), upload.single('govt_id'), uploadGovtId);
router.post('/:id/bookings', protect, authorize('admin_org', 'super_admin'), upload.single('ticket'), addBooking);
router.delete('/:id/bookings/:bookingId', protect, authorize('admin_org', 'super_admin'), deleteBooking);

// Proxy QR Download Route
router.get('/:id/qr/download', protect, authorize('admin_org', 'super_admin', 'user'), proxyDownloadQR);
router.get('/:id/govt-id/download', protect, authorize('admin_org', 'super_admin'), downloadGovtId);

// Admin Routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (filtered by Org)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, org_id]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               org_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.route('/')
    .post(protect, authorize('admin_org', 'super_admin'), createUser)
    .get(protect, authorize('admin_org', 'super_admin'), getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: User deleted
 */
router.route('/:id')
    .get(protect, getUserById)
    .put(protect, authorize('admin_org', 'super_admin'), updateUser)
    .delete(protect, authorize('admin_org', 'super_admin'), deleteUser);

module.exports = router;
