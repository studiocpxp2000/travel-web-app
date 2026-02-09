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
            if (org) {
                io.to(`admin_${org.slug}`).emit('new_helpdesk_message', message);
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
        if (req.user.role === 'admin_org') {
            if (req.query.user_id) {
                query.user_id = req.query.user_id;
            }
            // If no user_id is provided, return all (maybe grouped later, but list for now)
        } else {
            // Normal user strictly sees their own messages
            query.user_id = req.user.id;
        }

        const messages = await Message.find(query).sort({ createdAt: 1 });

        res.status(200).json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        next(err);
    }
};
