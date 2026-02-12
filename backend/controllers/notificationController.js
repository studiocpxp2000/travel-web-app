const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const { getIO } = require('../config/socket');

// @desc    Get Notifications (My Org)
// @route   GET /api/notifications
// @access  User, Admin
exports.getNotifications = async (req, res, next) => {
    try {
        let org_id = req.user.org_id;

        // Super Admin Override
        if (req.user.role === 'super_admin' && req.query.org_id) {
            org_id = req.query.org_id;
        }

        if (!org_id) {
            // If super admin and no org selected, maybe return empty or all?
            // Returning empty for safety unless specifically requested all (which is rare for notifications specific to org context)
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        const notifications = await Notification.find({ org_id })
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
        const { title, message, level } = req.body;

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
            level: level || 'info'
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

        if (req.user.role === 'super_admin' && (req.query.org_id || req.body.org_id)) {
            orgId = req.query.org_id || req.body.org_id;
        }

        if (!orgId) {
            return res.status(400).json({ success: false, message: 'Organization ID required' });
        }

        await Notification.deleteMany({ org_id: orgId });

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
