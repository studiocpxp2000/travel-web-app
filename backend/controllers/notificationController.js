const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { getIO } = require('../config/socket');
require('../config/firebaseAdmin');
const { getMessaging } = require('firebase-admin/messaging');

// @desc    Get Notifications (My Org)
// @route   GET /api/notifications
// @access  User, Admin
exports.getNotifications = async (req, res, next) => {
    try {
        let org_id = req.user.org_id;
        const type = req.query.type; // Optional: 'web' or 'mobile'

        // Super Admin Override
        if (req.user.role === 'super_admin' && req.query.org_id) {
            org_id = req.query.org_id;
        }

        if (!org_id) {
            // If super admin and no org selected, maybe return empty or all?
            // Returning empty for safety unless specifically requested all (which is rare for notifications specific to org context)
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        const query = { org_id };
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        next(err);
    }
};

// @desc    Create Notification (Broadcast)
// @route   POST /api/notifications
// @access  Admin
exports.createNotification = async (req, res, next) => {
    try {
        const { title, message, level, redirectUrl } = req.body;

        let org_id = req.user.org_id;

        if (req.user.role === 'super_admin' && req.body.org_id) {
            org_id = req.body.org_id;
        }

        if (!org_id) {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        const notification = await Notification.create({
            org_id,
            title,
            message,
            level: level || 'info',
            type: 'web',
            redirectUrl: redirectUrl || null
        });

        // Broadcast
        try {
            const io = getIO();
            const org = await Organization.findById(org_id).select('slug').lean();
            // Public room
            io.to(org.slug).emit('notification', notification);
        } catch (e) { }

        res.status(201).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Notification
// @route   DELETE /api/notifications/:id
// @access  Admin
exports.deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Verify ownership
        if (req.user.role !== 'super_admin' && notification.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this notification' });
        }

        await notification.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset All Notifications (For Org)
// @route   DELETE /api/notifications/reset
// @access  Admin
exports.resetNotifications = async (req, res, next) => {
    try {
        let orgId = req.user.org_id;
        const type = req.query.type || req.body.type;

        if (req.user.role === 'super_admin' && (req.query.org_id || req.body.org_id)) {
            orgId = req.query.org_id || req.body.org_id;
        }

        if (!orgId) {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        const query = { org_id: orgId };
        if (type) query.type = type;

        await Notification.deleteMany(query);

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Save FCM Token
// @route   POST /api/notifications/save-token
// @access  Public (from Mobile App)
exports.saveFcmToken = async (req, res, next) => {
    try {
        const { userId, fcmToken, orgId } = req.body;

        if (!userId || !fcmToken) {
            return res.status(400).json({ success: false, message: 'User ID and Token required' });
        }

        await User.findByIdAndUpdate(userId, { fcmToken });
        
        res.status(200).json({ success: true, message: 'Token saved' });
    } catch (err) {
        next(err);
    }
};

// @desc    Send Global Push Notification
// @route   POST /api/notifications/send-global
// @access  Admin
    exports.sendGlobalPush = async (req, res, next) => {
        try {
            const { title, message, redirectUrl, scheduledFor, targetUserIds } = req.body;
            let orgId = req.user.org_id;

            if (req.user.role === 'super_admin' && req.body.org_id) {
                orgId = req.body.org_id;
            }

            if (!orgId) {
                return res.status(400).json({ success: false, message: 'Organization ID required' });
            }

            // Build query to get FCM tokens
            const userQuery = { org_id: orgId, fcmToken: { $exists: true, $ne: null } };
            
            // If targetUserIds is provided and not empty, only fetch those users
            if (targetUserIds && Array.isArray(targetUserIds) && targetUserIds.length > 0) {
                userQuery._id = { $in: targetUserIds };
            }

            // Get users in this org with an FCM token (filtered if targetUserIds exists)
            const users = await User.find(userQuery).select('fcmToken');
        const tokens = users.map(u => u.fcmToken).filter(Boolean);

        const isScheduled = !!scheduledFor && new Date(scheduledFor) > new Date();

        // Also save it to our database for the in-app history
            const notification = await Notification.create({
                org_id: orgId,
                title,
                message,
                level: 'info',
                type: 'mobile',
                redirectUrl: redirectUrl || null,
                scheduledFor: isScheduled ? new Date(scheduledFor) : null,
                isSent: !isScheduled,
                target_user_ids: (targetUserIds && targetUserIds.length > 0) ? targetUserIds : undefined
            });

        if (isScheduled) {
            return res.status(200).json({ success: true, message: 'Push notification scheduled successfully' });
        }

        if (tokens.length === 0) {
            return res.status(200).json({ success: true, message: 'Saved to history, but no push devices found' });
        }

        // Send via Firebase
        const payload = {
            notification: {
                title,
                body: message,
            },
            data: {}
        };
        
        if (redirectUrl) {
            payload.data.route = redirectUrl;
        }

        const response = await getMessaging().sendEachForMulticast({
            tokens,
            notification: payload.notification,
            data: payload.data
        });

        res.status(200).json({ 
            success: true, 
            message: `Push sent to ${response.successCount} devices.`,
            failedCount: response.failureCount
        });
    } catch (err) {
        next(err);
    }
};
