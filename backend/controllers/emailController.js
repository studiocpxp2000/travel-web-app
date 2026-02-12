const SentEmail = require('../models/SentEmail');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Send bulk email
// @route   POST /api/admin/emails/send
// @access  Private (Admin)
exports.sendEmail = async (req, res, next) => {
    try {
        const { subject, html_content, recipients, cc, bcc } = req.body;
        const org_id = req.user.org_id;

        if (!subject || !html_content || !recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Subject, content, and at least one recipient are required'
            });
        }

        // Format recipients array
        const formattedRecipients = recipients.map(email => ({
            email: email.toLowerCase().trim(),
            status: 'pending'
        }));

        // Create sent email record
        const sentEmail = await SentEmail.create({
            org_id,
            subject,
            html_content,
            recipients: formattedRecipients,
            cc: cc || [],
            bcc: bcc || [],
            sent_by: req.user._id,
            total_recipients: recipients.length,
            status: 'sending'
        });

        // TODO: Integrate with actual email service (Brevo/SendGrid)
        // For now, simulate sending by marking all as sent
        const updatedRecipients = formattedRecipients.map(r => ({
            ...r,
            status: 'sent',
            sent_at: new Date()
        }));

        sentEmail.recipients = updatedRecipients;
        sentEmail.successful_sends = recipients.length;
        sentEmail.status = 'completed';
        await sentEmail.save();

        res.status(201).json({
            success: true,
            message: `Email sent to ${recipients.length} recipient(s)`,
            data: {
                id: sentEmail._id,
                subject: sentEmail.subject,
                total_recipients: sentEmail.total_recipients,
                successful_sends: sentEmail.successful_sends,
                failed_sends: sentEmail.failed_sends
            }
        });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
};

// @desc    Get sent emails history
// @route   GET /api/admin/emails
// @access  Private (Admin)
exports.getSentEmails = async (req, res, next) => {
    try {
        let query = {};

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            query.org_id = req.user.org_id;
        }
        // If Super Admin, allow filtering by org_id
        else if (req.user.role === 'super_admin' && req.query.org_id) {
            query.org_id = req.query.org_id;
        }

        // Export mode: return all emails with full details, no pagination
        if (req.query.export === 'true') {
            const emails = await SentEmail.find(query)
                .sort({ createdAt: -1 })
                .populate('sent_by', 'name email');

            return res.json({
                success: true,
                data: emails
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const emails = await SentEmail.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('subject total_recipients successful_sends failed_sends status createdAt');

        const total = await SentEmail.countDocuments(query);

        res.json({
            success: true,
            data: emails,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get sent emails error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sent emails'
        });
    }
};

// @desc    Get unregistered users (emails sent but not in users table)
// @route   GET /api/admin/emails/unregistered
// @access  Private (Admin)
exports.getUnregisteredUsers = async (req, res, next) => {
    try {
        let matchStage = {};

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            matchStage.org_id = req.user.org_id;
        }
        // If Super Admin, allow filtering or require it?
        // For unregistered users, it likely makes sense to scope to an org.
        else if (req.user.role === 'super_admin' && req.query.org_id) {
            matchStage.org_id = new mongoose.Types.ObjectId(req.query.org_id);
        } else if (req.user.role === 'super_admin') {
            // If no org_id provided for super admin, maybe return empty or handle differently?
            // Since we cross-reference with User table by org, we really need an org context.
            // For simplicity, if no org_id, return empty or error.
            return res.json({ success: true, data: [], message: 'Org ID required for Super Admin' });
        }

        // Get all unique emails from sent emails for this org
        const sentEmails = await SentEmail.aggregate([
            { $match: matchStage },
            { $unwind: '$recipients' },
            { $group: { _id: '$recipients.email' } }
        ]);

        const sentEmailAddresses = sentEmails.map(e => e._id);

        if (sentEmailAddresses.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: 'No emails have been sent yet'
            });
        }

        // Get all registered users' emails for this org
        const registeredUsers = await User.find({ org_id: matchStage.org_id || req.user.org_id })
            .select('email')
            .lean();

        const registeredEmails = new Set(
            registeredUsers.map(u => u.email?.toLowerCase()).filter(Boolean)
        );

        // Filter to find unregistered emails
        const unregisteredEmails = sentEmailAddresses.filter(
            email => !registeredEmails.has(email?.toLowerCase())
        );

        res.json({
            success: true,
            data: unregisteredEmails,
            count: unregisteredEmails.length
        });
    } catch (error) {
        console.error('Get unregistered users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unregistered users'
        });
    }
};

// @desc    Get sent email details
// @route   GET /api/admin/emails/:id
// @access  Private (Admin)
exports.getSentEmailDetails = async (req, res, next) => {
    try {
        let query = { _id: req.params.id };

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            query.org_id = req.user.org_id;
        }

        const email = await SentEmail.findOne(query)
            .populate('sent_by', 'name email');

        if (!email) {
            return res.status(404).json({
                success: false,
                message: 'Email not found'
            });
        }

        res.json({
            success: true,
            data: email
        });
    } catch (error) {
        console.error('Get email details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email details'
        });
    }
};
