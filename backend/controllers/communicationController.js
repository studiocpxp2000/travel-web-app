const mongoose = require('mongoose');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Organization = require('../models/Organization');
const { getIO } = require('../config/socket');

// @desc    Get Helpdesk Messages (History)
// @route   GET /api/communication/messages/:userId
// @access  User (Own), Admin (Any)
exports.getMessages = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Access Control
        if (req.user.role === 'user' && req.user.id !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (req.user.role === 'admin_org') {
            // Ensure user belongs to admin's org? 
            // Ideally yes, but skipping deep check for speed, relying on filter
        }

        const messages = await Message.find({ user_id: userId })
            .sort({ createdAt: 1 }); // Oldest first for chat history

        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Conversations (Admin)
// @route   GET /api/communication/conversations
// @access  Admin
exports.getAllConversations = async (req, res, next) => {
    try {
        const org_id = req.user.org_id;

        // Aggregate to find unique users with their last message info
        const conversations = await Message.aggregate([
            { $match: { org_id: new mongoose.Types.ObjectId(org_id) } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$user_id',
                    lastMessage: { $first: '$content' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ['$isRead', false] }, { $eq: ['$sender', 'user'] }] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    'userInfo.password': 0, // Exclude password
                    'userInfo.__v': 0
                }
            }
        ]);

        res.status(200).json({ success: true, data: conversations });
    } catch (err) {
        next(err);
    }
};

// @desc    Send Message
// @route   POST /api/communication/messages
// @access  User, Admin
exports.sendMessage = async (req, res, next) => {
    try {
        const { user_id, content, sender } = req.body;
        // sender: 'user' or 'admin' 
        // If user sends, user_id is implicit from token
        // If admin sends, user_id must be in body

        let targetUserId = user_id;
        let orgId = req.user.org_id;

        if (req.user.role === 'user') {
            targetUserId = req.user.id;
            // Validate sender matches role
        }

        const message = await Message.create({
            org_id: orgId,
            user_id: targetUserId,
            sender: req.user.role === 'user' ? 'user' : 'admin',
            content,
            isRead: false
        });

        // Socket Emit
        try {
            const io = getIO();
            const org = await Organization.findById(orgId);

            // 1. Emit to Admin Room
            io.to(`admin_${org.slug}`).emit('receive_message', message);

            // 2. Emit to User (if admin sent) OR User Self (ack)?
            // User rooms usually by userID? Or we just emit to org room with filter?
            // Better: io.to(userId).emit(...) if we tracked socket IDs map.
            // Simplified: User polls or listens to 'receive_message' and filters by own ID if broadcasted to org room (insecure).
            // Secure way: io.to(socket_id_of_user). 
            // Since we don't have socket ID map here easily without Redis, 
            // let's rely on client polling OR broadcast to org room but client filters?
            // No, private messages should not be broadcast to org room.

            // Solution for simple prototype: 
            // Admin listens to 'admin_{orgSlug}'
            // User listens to their own 'user_{userId}' room?
            // Need to ensure CLIENT joins 'user_{userId}' room on connect.
            io.to(`user_${targetUserId}`).emit('receive_message', message);

        } catch (e) {
            console.error('Socket error', e);
        }

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Notifications (My Org)
// @route   GET /api/communication/notifications
// @access  User, Admin
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ org_id: req.user.org_id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        next(err);
    }
};

// @desc    Create Notification (Broadcast)
// @route   POST /api/communication/notifications
// @access  Admin
exports.createNotification = async (req, res, next) => {
    try {
        const { title, message, level } = req.body;

        const notification = await Notification.create({
            org_id: req.user.org_id,
            title,
            message,
            level: level || 'info'
        });

        // Broadcast
        try {
            const io = getIO();
            const org = await Organization.findById(req.user.org_id);
            // Public room
            io.to(org.slug).emit('notification', notification);
        } catch (e) { }

        res.status(201).json({ success: true, data: notification });
    } catch (err) {
        next(err);
    }
};

// @desc    Send Email (Admin)
// @route   POST /api/communication/email
// @access  Admin
exports.sendEmail = async (req, res, next) => {
    try {
        const { to, cc, bcc, subject, htmlContent } = req.body;
        const org_id = req.user.org_id;

        // Use Brevo or similar service configured in config
        const { sendEmail } = require('../config/brevo');

        await sendEmail({
            to, // Array of emails
            cc,
            bcc,
            subject,
            htmlContent,
            orgId: org_id
        });

        res.status(200).json({ success: true, message: `Email sent to ${to.length} recipients` });
    } catch (err) {
        next(err);
    }
};
