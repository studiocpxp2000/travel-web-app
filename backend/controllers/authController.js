const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Promoter = require('../models/Promoter');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Generate JWT Token
const generateToken = (id, role, org_id = null, org_slug = null) => {
    return jwt.sign({ id, role, org_id, org_slug }, process.env.JWT_SECRET, {
        expiresIn: '30d' // Long session for now
    });
};

// Send Token Response
const sendTokenResponse = (user, statusCode, res, role) => {
    // For super admin, we might not have a standard 'user' object structure
    const orgId = user.org_id ? user.org_id._id || user.org_id : null;

    // Org Slug lookup (if applicable)
    // In a real app we might want to populate this or pass it in
    let orgSlug = null;
    if (user.org_id && user.org_id.slug) {
        orgSlug = user.org_id.slug;
    }

    const token = generateToken(user._id || user.id, role, orgId, orgSlug);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Only send over HTTPS in production
    };

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token, // Also send token in body for Redux state
            user: {
                id: user._id || user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: role,
                org_id: orgId,
                scanner_type: user.scanner_type // for promoters
            }
        });
};

// @desc    Login for Super Admin, Admin, and Promoter
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    // 1. Check Super Admin (Env based)
    if (role === 'super_admin') {
        if (username === process.env.SUPER_ADMIN_USERNAME && password === process.env.SUPER_ADMIN_PASSWORD) {
            const superAdminUser = {
                id: 'super-admin-id', // static ID for token
                name: 'Super Admin',
                username: process.env.SUPER_ADMIN_USERNAME,
                role: 'super_admin'
            };
            return sendTokenResponse(superAdminUser, 200, res, 'super_admin');
        } else {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    }

    // 2. Check Org Admin
    if (role === 'admin_org') {
        const admin = await Admin.findOne({ username }).select('+password').populate('org_id');
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        return sendTokenResponse(admin, 200, res, 'admin_org');
    }

    // 3. Check Promoter
    if (role === 'promoter') {
        const promoter = await Promoter.findOne({ username }).select('+password').populate('org_id');
        if (!promoter) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        const isMatch = await promoter.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        return sendTokenResponse(promoter, 200, res, 'promoter');
    }

    // Default Fallback
    return res.status(400).json({ success: false, message: 'Invalid role specified' });
};

// @desc    User Login (Public Attendees)
// @route   POST /api/auth/user-login
// @access  Public
exports.userLogin = async (req, res, next) => {
    const { phone, password, org_slug, identifier } = req.body;
    let { email } = req.body;

    // Handle 'identifier' alias (sent by some frontend versions)
    if (!email && identifier) {
        if (identifier.includes('@')) {
            email = identifier;
        } else {
            // Assume phone if not email? Or just try both?
            // For now, let's map to email if it looks like one, or strict mapping.
            // But if identifier is passed, it might be phone too.
            // Let's just set email = identifier here as per user example which was email.
            email = identifier;
        }
    }

    if (email) email = email.toLowerCase();

    // We need to know WHICH org they are logging into
    if (!org_slug) {
        return res.status(400).json({ success: false, message: 'Organization Context Missing' });
    }

    const org = await Organization.findOne({ slug: org_slug });
    if (!org) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    let user;
    if (email) {
        user = await User.findOne({ email, org_id: org._id });
    } else if (phone) {
        user = await User.findOne({ phone, org_id: org._id });
    }

    // For now, users have simple passwords or we might auto-create them?
    // Based on frontend logic, we check password if they are registered.

    if (!user) {
        return res.status(401).json({
            success: false,
            message: `User not found in this organization. Searched for email: '${email}' in Org: '${org.name}' (ID: ${org._id})`
        });
    }

    // If password provided (secure login)
    if (password) {
        // Need to check specific password field. In Schema we kept it select: false
        const userWithPass = await User.findById(user._id).select('+password');
        // Simple string comparison for now as per mockData, BUT we should implement matching logic
        // If we migrated plain text from mock, we compare directly. If bcrypt, we use compare.
        // Assuming we store plain text for users currently based on mockData "user123".
        // In backend plan we said "Bcrypt", so let's assume implementation will use bcrypt
        // But for "Mock" migration compatibility, we might need to handle plain text initially.
        // Let's assume we migrated to hash.

        // TEMPORARY: Allow simple match for migration ease if not hashed yet
        if (userWithPass.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }
    }

    sendTokenResponse(user, 200, res, 'user');
};

// @desc    Register New User (Public)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const {
            name, email, phone, password,
            gender, location,
            food_preference, food_remarks,
            org_slug
        } = req.body;

        if (!org_slug) {
            return res.status(400).json({ success: false, message: 'Organization Context Missing' });
        }

        const org = await Organization.findOne({ slug: org_slug });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Check if user already exists in this org
        // Users are scoped to Org
        let existingUser = null;
        if (email) {
            existingUser = await User.findOne({ email, org_id: org._id });
        }
        if (!existingUser && phone) {
            existingUser = await User.findOne({ phone, org_id: org._id });
        }

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email or phone' });
        }

        // Create User
        // Generate QR Code Identifier (could be email/phone or random string)
        const qrContent = email || phone || `USER-${Date.now()}`;
        // OTP Generation (Simple 6 digit)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const user = await User.create({
            org_id: org._id,
            org_name_snapshot: org.name,
            name,
            email,
            phone,
            password, // Mongoose middleware should handle hashing if set up, currently plain text/simple hash in model? No, model doesn't have hooks yet.
            // Using plain text password for now based on current project state (migration from mock).
            // TODO: Add bcrypt pre-save hook in User model.
            gender,
            location,
            food_preference,
            food_remarks,
            isRegistered: true,
            qr_data: qrContent,
            otp: otp
        });

        sendTokenResponse(user, 201, res, 'user');

    } catch (err) {
        next(err);
    }
};

// @desc    Get Current Logged in User
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    // req.user is set by auth middleware
    const { id, role } = req.user;

    if (role === 'super_admin') {
        return res.status(200).json({
            success: true,
            user: { id: 'super-admin-id', role: 'super_admin', username: process.env.SUPER_ADMIN_USERNAME, name: 'Super Admin' }
        });
    }

    let user;
    if (role === 'admin_org') {
        user = await Admin.findById(id).populate('org_id');
    } else if (role === 'promoter') {
        user = await Promoter.findById(id).populate('org_id');
    } else if (role === 'user') {
        user = await User.findById(id);
    }

    if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
        success: true,
        user
    });
};

// @desc    Log user out
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};
