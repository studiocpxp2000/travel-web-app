const mongoose = require('mongoose');
const Message = require('../models/Message');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { getIO } = require('../config/socket');

// @desc    Send a message to Helpdesk (User -> Admin)
// @route   POST /api/messages
// @access  Private (User)
exports.sendMessage = async (req, res, next) => {
    try {
        const { content, image_url } = req.body;
        const userId = req.user.id;
        const orgId = req.user.org_id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        const message = await Message.create({
            org_id: orgId,
            user_id: userId,
            sender: 'user',
            content,
            image_url,
            isRead: false
        });

        // Emit to Admin Room
        try {
            const io = getIO();
            const org = await Organization.findById(orgId);
            const user = await User.findById(userId).select('name email phone');

            if (org) {
                const messageWithUser = {
                    ...message.toObject(),
                    userInfo: user // Attach user info for "New Conversation" handling
                };
                io.to(`admin_${org.slug}`).emit('new_helpdesk_message', messageWithUser);
            }
        } catch (e) {
            console.error('Socket emit error:', e);
        }

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

// @desc    Reply to a message (Admin -> User)
// @route   POST /api/messages/reply
// @access  Private (Admin)
exports.replyMessage = async (req, res, next) => {
    try {
        const { user_id, content, image_url } = req.body;
        const adminId = req.user.id;
        const orgId = req.user.org_id;

        if (!content || !user_id) {
            return res.status(400).json({ success: false, message: 'Content and user_id are required' });
        }

        const message = await Message.create({
            org_id: orgId,
            user_id: user_id,
            sender: 'admin',
            content,
            image_url,
            isRead: false // User needs to read it
        });

        // Emit to Specific User Room
        try {
            const io = getIO();
            io.to(`user_${user_id}`).emit('helpdesk_response', message);
        } catch (e) {
            console.error('Socket emit error:', e);
        }

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

// @desc    Get messages for a user (or all for admin)
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
    try {
        const orgId = req.user.org_id;
        let query = { org_id: orgId };

        // If 'admin_org', they might want ALL messages or messages for a specific user
        if (req.user.role === 'admin_org' || req.user.role === 'super_admin') { // Check for super_admin too
            if (req.user.org_id) {
                query.org_id = req.user.org_id;
            }
            if (req.query.user_id) {
                query.user_id = req.query.user_id;
            }
        } else {
            // Normal user strictly sees their own messages
            query.user_id = req.user.id;
        }

        const messages = await Message.find(query).sort({ createdAt: 1 });

        // Mark messages as read if admin fetches them
        if ((req.user.role === 'admin_org' || req.user.role === 'super_admin') && req.query.user_id) {
            await Message.updateMany(
                { org_id: orgId, user_id: req.query.user_id, sender: 'user', isRead: false },
                { $set: { isRead: true } }
            );
        }

        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all conversations for Admin (Grouped by User)
// @route   GET /api/messages/conversations
// @access  Private (Admin)
exports.getConversations = async (req, res, next) => {
    try {
        const orgId = req.user.org_id;

        const conversations = await Message.aggregate([
            { $match: { org_id: new mongoose.Types.ObjectId(orgId) } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$user_id',
                    lastMessage: { $first: '$content' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] }, 1, 0]
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
                    _id: 1,
                    lastMessage: 1,
                    lastMessageTime: 1,
                    unreadCount: 1,
                    'userInfo.name': 1,
                    'userInfo.email': 1,
                    'userInfo.phone': 1
                }
            },
            { $sort: { lastMessageTime: -1 } }
        ]);

        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset all messages for an organization
// @route   DELETE /api/messages/reset
// @access  Private (Admin)
exports.resetMessages = async (req, res, next) => {
    try {
        const orgId = req.user.org_id;

        // Delete all messages for this org
        await Message.deleteMany({ org_id: orgId });

        // Emit to Admin Room to clear UI immediately if needed (optional, but good for other admins)
        // frontend cache tag invalidation handles the initiator, but sockets handle others.
        // For simplicity, we rely on RTK Query invalidation for the initiator.

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
