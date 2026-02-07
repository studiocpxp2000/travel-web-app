const User = require('../models/User');
const Organization = require('../models/Organization');
const { s3 } = require('../config/s3');
const { DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

// @desc    Upload Government ID
// @route   PUT /api/users/:id/govt-id
// @access  Admin, Super Admin
exports.uploadGovtId = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('org_id');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Auth check for admin_org
        if (req.user.role === 'admin_org' && user.org_id._id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const orgSlug = user.org_id?.slug || 'unknown';

        // Delete old govt ID from S3 if exists
        if (user.govt_id_key) {
            try {
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: user.govt_id_key
                }));
            } catch (s3Err) {
                console.error('Failed to delete old govt ID:', s3Err.message);
            }
        }

        // File is already uploaded by multer-s3, update user
        user.govt_id_url = req.file.location;
        user.govt_id_key = req.file.key;
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                govt_id_url: user.govt_id_url,
                govt_id_key: user.govt_id_key
            }
        });
    } catch (err) {
        console.error('Upload govt ID error:', err);
        next(err);
    }
};

// @desc    Add Booking Document
// @route   POST /api/users/:id/bookings
// @access  Admin, Super Admin
exports.addBooking = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('org_id');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Auth check for admin_org
        if (req.user.role === 'admin_org' && user.org_id._id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const bookingType = req.body.type || 'other';

        // Create booking entry
        const booking = {
            type: bookingType,
            ticket_url: req.file.location,
            ticket_key: req.file.key,
            filename: req.file.originalname,
            uploadedAt: new Date()
        };

        user.bookings.push(booking);
        await user.save();

        // Return the newly added booking with its ID
        const addedBooking = user.bookings[user.bookings.length - 1];

        res.status(201).json({
            success: true,
            data: addedBooking
        });
    } catch (err) {
        console.error('Add booking error:', err);
        next(err);
    }
};

// @desc    Delete Booking Document
// @route   DELETE /api/users/:id/bookings/:bookingId
// @access  Admin, Super Admin
exports.deleteBooking = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate('org_id');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Auth check for admin_org
        if (req.user.role === 'admin_org' && user.org_id._id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const bookingId = req.params.bookingId;
        const booking = user.bookings.id(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Delete from S3
        if (booking.ticket_key) {
            try {
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: booking.ticket_key
                }));
            } catch (s3Err) {
                console.error('Failed to delete booking from S3:', s3Err.message);
            }
        }

        // Remove booking from array
        user.bookings.pull(bookingId);
        await user.save();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.error('Delete booking error:', err);
        next(err);
    }
};
