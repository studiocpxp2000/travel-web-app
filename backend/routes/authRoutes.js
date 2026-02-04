const express = require('express');
const router = express.Router();
const { login, userLogin, register, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login for Admin, Super Admin, and Promoter
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, role]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [super_admin, admin_org, promoter]
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login); // Admin/Promoter/SuperAdmin

/**
 * @swagger
 * /auth/user-login:
 *   post:
 *     summary: Login for Users
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [org_slug]
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               org_slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/user-login', userLogin); // Public Users

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, org_slug]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               org_slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 */
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
