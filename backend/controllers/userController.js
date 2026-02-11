const User = require('../models/User');
const Score = require('../models/Score');
const Organization = require('../models/Organization');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { generateAndUploadQR } = require('../services/qrService');

// @desc    Create User (Admin)
// @route   POST /api/users
// @access  Admin, Super Admin
exports.createUser = async (req, res, next) => {
    try {
        const {
            name, email, phone, gender, location,
            food_preference, food_remarks,
            passport_number, govt_id_number, password,
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

        // Create User Instance - convert empty strings to undefined for enum fields
        const user = new User({
            org_id: targetOrgId,
            org_name_snapshot: org.name,
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            gender: gender || undefined, // enum field - empty string is invalid
            location: location || undefined,
            food_preference: food_preference || undefined, // enum field - empty string is invalid
            food_remarks: food_remarks || undefined,
            passport_number: passport_number || undefined,
            govt_id_number: govt_id_number || undefined,
            password: password || 'user123'
        });

        // Save user first
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

        // Generate QR Image using email and Upload to S3
        try {
            const qrData = user.email || `user-${user._id}`;
            const qrUrl = await generateAndUploadQR(qrData, org.slug, user._id);
            user.qr_code_url = qrUrl;
            await user.save();
        } catch (qrError) {
            console.error('Failed to generate QR for user:', user._id, qrError);
            // Continue without QR URL, can be regenerated later
        }

        res.status(201).json({ success: true, data: user });

    } catch (err) {
        console.error('Create user error:', err);
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

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await User.countDocuments(query);

        // Include password for admin view (select: false in schema)
        const users = await User.find(query)
            .select('+password')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = { page: page + 1, limit };
        }
        if (startIndex > 0) {
            pagination.prev = { page: page - 1, limit };
        }

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            pagination,
            data: users
        });
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
        const user = await User.findById(req.params.id).populate('org_id');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (req.user.role === 'admin_org' && user.org_id._id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const orgSlug = user.org_id?.slug || 'unknown';

        // 1. Delete QR code from S3
        if (user.qr_code_url) {
            try {
                const qrKey = `${orgSlug}/users/${user._id}/qr/code.png`;
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: qrKey
                }));
            } catch (s3Err) {
                console.error('Failed to delete QR from S3:', s3Err.message);
            }
        }

        // 2. Delete Govt ID from S3
        if (user.govt_id_key || user.govt_id_url) {
            try {
                let keyToDelete = user.govt_id_key;

                if (!keyToDelete && user.govt_id_url) {
                    try {
                        const url = new URL(user.govt_id_url);
                        let pathname = url.pathname;
                        // Handle path-style URLs (s3.region.amazonaws.com/bucket/key)
                        if (pathname.startsWith(`/${process.env.AWS_BUCKET_NAME}/`)) {
                            pathname = pathname.replace(`/${process.env.AWS_BUCKET_NAME}/`, '');
                        } else {
                            pathname = pathname.substring(1); // Remove leading /
                        }
                        keyToDelete = decodeURIComponent(pathname);
                    } catch (e) {
                        console.warn('Could not parse govt_id_url:', e);
                    }
                }

                if (keyToDelete) {
                    await s3.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: keyToDelete
                    }));
                }
            } catch (s3Err) {
                console.error('Failed to delete govt ID from S3:', s3Err.message);
            }
        }

        // 3. Delete All Booking Documents from S3
        if (user.bookings && user.bookings.length > 0) {
            const deletePromises = user.bookings
                .filter(booking => booking.ticket_key)
                .map(async (booking) => {
                    try {
                        await s3.send(new DeleteObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: booking.ticket_key
                        }));
                    } catch (s3Err) {
                        console.error(`Failed to delete booking ${booking._id} from S3:`, s3Err.message);
                    }
                });

            await Promise.all(deletePromises);
        }

        // 4. Delete User from DB
        await user.deleteOne();
        await Score.deleteOne({ user_id: user._id });

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

// @desc    Generate missing QR codes for users without qr_code_url
// @route   POST /api/users/generate-missing-qr
// @access  Admin, Super Admin
exports.generateMissingQRCodes = async (req, res, next) => {
    try {
        let query = { qr_code_url: { $in: [null, '', undefined] } };

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            query.org_id = req.user.org_id;
        }
        // If Super Admin with org_id filter
        else if (req.user.role === 'super_admin' && req.query.org_id) {
            query.org_id = req.query.org_id;
        }

        // Find users without QR codes
        const usersWithoutQR = await User.find(query).populate('org_id');

        if (usersWithoutQR.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'All users already have QR codes',
                generated: 0
            });
        }

        let generated = 0;
        let failed = 0;

        for (const user of usersWithoutQR) {
            try {
                const org = user.org_id;
                if (!org || !org.slug) {
                    console.log(`Skipping user ${user._id}: org not found`);
                    failed++;
                    continue;
                }

                // Generate QR Data if missing
                if (!user.qr_data) {
                    user.qr_data = `QR-${org.slug.toUpperCase()}-${user._id.toString().slice(-6).toUpperCase()}`;
                }

                // Generate and upload QR
                const qrUrl = await generateAndUploadQR(user.qr_data, org.slug, user._id);
                user.qr_code_url = qrUrl;
                await user.save();
                generated++;

            } catch (qrErr) {
                console.error(`Failed to generate QR for user ${user._id}:`, qrErr.message);
                failed++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Generated QR codes for ${generated} users`,
            generated,
            failed,
            total: usersWithoutQR.length
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Proxy download QR code (bypasses CORS)
// @route   GET /api/users/:id/qr/download
// @access  Admin
exports.proxyDownloadQR = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.qr_code_url) {
            return res.status(404).json({ success: false, message: 'QR code not available for this user' });
        }

        // Fetch the QR code from S3
        const response = await fetch(user.qr_code_url);
        if (!response.ok) {
            return res.status(502).json({ success: false, message: 'Failed to fetch QR code from storage' });
        }

        // Get the image buffer
        const buffer = await response.arrayBuffer();

        // Set headers for download
        const filename = `qr-${user.name?.replace(/\s+/g, '-').toLowerCase() || user._id}.png`;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.byteLength);

        // Send the buffer
        res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('Proxy download error:', err);
        next(err);
    }
};

// @desc    Download User Govt ID (Proxy)
// @route   GET /api/users/:id/govt-id/download
// @access  Admin, Super Admin
exports.downloadGovtId = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.govt_id_key) {
            // Fallback: If no key but has URL, try to parse key or redirect
            if (user && user.govt_id_url) {
                return res.redirect(user.govt_id_url);
            }
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: user.govt_id_key
        });

        try {
            const response = await s3.send(command);

            // Set headers
            res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
            const ext = user.govt_id_key.split('.').pop() || 'jpg';
            const filename = `govt_id_${user.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Stream
            response.Body.pipe(res);
        } catch (s3Error) {
            console.error('S3 Download Error:', s3Error);
            // Fallback to redirect if S3 fetch fails (e.g. permissions)
            if (user.govt_id_url) {
                return res.redirect(user.govt_id_url);
            }
            return res.status(500).json({ success: false, message: 'Failed to retrieve document' });
        }
    } catch (err) {
        next(err);
    }
};
