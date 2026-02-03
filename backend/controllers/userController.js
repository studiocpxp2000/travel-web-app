const User = require('../models/User');
const Score = require('../models/Score');
const Organization = require('../models/Organization');
const { generateAndUploadQR } = require('../services/qrService');

// @desc    Create User (Admin)
// @route   POST /api/users
// @access  Admin, Super Admin
exports.createUser = async (req, res, next) => {
    try {
        const {
            name, email, phone, gender, location,
            food_preference, food_remarks,
            passport_number, govt_id_number,
            org_id // If super admin, might pass this
        } = req.body;

        // Determine Org ID
        let targetOrgId = req.user.org_id;
        if (req.user.role === 'super_admin') {
            if (!org_id) return res.status(400).json({ success: false, message: 'Org ID required for Super Admin' });
            targetOrgId = org_id;
        }

        // Fetch Org to get Slug
        const org = await Organization.findById(targetOrgId);
        if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

        // Check Duplicates (Email or Phone within Org)
        if (email) {
            const exists = await User.findOne({ email, org_id: targetOrgId });
            if (exists) return res.status(400).json({ success: false, message: 'User with this email already exists in this organization' });
        }

        // Create User Instance (without saving yet to get ID)
        const user = new User({
            org_id: targetOrgId,
            org_name_snapshot: org.name,
            name,
            email,
            phone,
            gender,
            location,
            food_preference,
            food_remarks,
            passport_number,
            govt_id_number,
            password: 'user123' // Default password as per plan/mock
        });

        // Generate QR Data/Content
        // Format: QR-ORGSLUG-USERID
        const qrData = `QR-${org.slug.toUpperCase()}-${user._id.toString().slice(-6).toUpperCase()}`;
        user.qr_data = qrData;

        // Save first to get ID for S3 path (although we have ._id)
        await user.save();

        // Initialize Score
        await Score.create({
            user_id: user._id,
            org_id: targetOrgId,
            user_name_snapshot: user.name,
            user_email_snapshot: user.email,
            current_score: 0,
            history: []
        });

        // Generate QR Image and Upload
        // We do this async usually, but for reliability let's await
        try {
            const qrUrl = await generateAndUploadQR(qrData, org.slug, user._id);
            user.qr_code_url = qrUrl;
            await user.save();
        } catch (qrError) {
            console.error('Failed to generate QR for user:', user._id, qrError);
            // Continue without QR URL, can be regenerated later
        }

        res.status(201).json({ success: true, data: user });

    } catch (err) {
        next(err);
    }
};

// @desc    Get All Users (Filtered by Org)
// @route   GET /api/users
// @access  Admin, Super Admin
exports.getUsers = async (req, res, next) => {
    try {
        let query = {};

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            query.org_id = req.user.org_id;
        }
        // If Super Admin, allow filtering by org_id in query params
        else if (req.user.role === 'super_admin' && req.query.org_id) {
            query.org_id = req.query.org_id;
        }

        const users = await User.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Single User
// @route   GET /api/users/:id
// @access  Admin, Super Admin, Owner
exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Access Control
        if (req.user.role === 'admin_org' && user.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this user' });
        }
        if (req.user.role === 'user' && user._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Update User
// @route   PUT /api/users/:id
// @access  Admin, Super Admin
exports.updateUser = async (req, res, next) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Access Control
        if (req.user.role === 'admin_org' && user.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update fields
        // Allowing all body updates for simplicity for now, excluding sensitive ones ideally
        user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        // If name updated, sync Score snapshot?
        // Ideally handled in Schema Pre-save or Post-save, or here explicitly
        if (req.body.name) {
            await Score.updateOne({ user_id: user._id }, { user_name_snapshot: req.body.name });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete User
// @route   DELETE /api/users/:id
// @access  Admin, Super Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.user.role === 'admin_org' && user.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await user.deleteOne(); // Trigger mongoose middleware if any
        await Score.deleteOne({ user_id: user._id }); // Cleanup score

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Profile (Self)
// @route   PUT /api/users/profile/me
// @access  User
exports.updateProfile = async (req, res, next) => {
    try {
        // Prevent updating sensitive fields like org_id, role, etc.
        const allowedFields = ['name', 'phone', 'gender', 'location', 'food_preference', 'food_remarks', 'passport_number', 'govt_id_number']; // etc

        // Filter body
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};
