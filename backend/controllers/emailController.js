const SentEmail = require('../models/SentEmail');
const User = require('../models/User');
const mongoose = require('mongoose');
const { sendBulkEmails } = require('../config/brevo');

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

        // Create sent email record immediately
        const sentEmail = await SentEmail.create({
            org_id,
            subject,
            html_content,
            recipients: formattedRecipients,
            cc: cc || [],
            bcc: bcc || [],
            sent_by: req.user.id || req.user._id,
            total_recipients: recipients.length,
            status: 'sending'
        });

        const recipientEmails = formattedRecipients.map(r => r.email);
        let updatedRecipients;
        let summary;

        try {
            const { results } = await sendBulkEmails({
                recipients: recipientEmails,
                subject,
                htmlContent: html_content,
                cc: cc || [],
                bcc: bcc || []
            });

            updatedRecipients = formattedRecipients.map(r => {
                const result = results.find(res => res.email === r.email);
                return {
                    ...r,
                    status: result?.success ? 'sent' : 'failed',
                    sent_at: result?.success ? new Date() : undefined,
                    error: result?.error || undefined
                };
            });

            summary = {
                total: recipients.length,
                successful: updatedRecipients.filter(r => r.status === 'sent').length,
                failed: updatedRecipients.filter(r => r.status === 'failed').length
            };

            console.log(`[EMAIL] Campaign ${sentEmail._id} complete: ${summary.successful}/${summary.total} sent`);
        } catch (bgError) {
            console.error(`[EMAIL] Send failed for campaign ${sentEmail._id}:`, bgError);
            const errMsg = bgError.message || 'Send failed';
            updatedRecipients = formattedRecipients.map(r => ({
                ...r,
                status: 'failed',
                error: errMsg
            }));
            summary = {
                total: recipients.length,
                successful: 0,
                failed: recipients.length
            };
        }

        sentEmail.recipients = updatedRecipients;
        sentEmail.successful_sends = summary.successful;
        sentEmail.failed_sends = summary.failed;
        sentEmail.status = summary.failed === summary.total ? 'failed' : 'completed';
        await sentEmail.save();

        const successful_emails = updatedRecipients.filter(r => r.status === 'sent').map(r => r.email);
        const failed_recipients = updatedRecipients
            .filter(r => r.status === 'failed')
            .map(r => ({
                email: r.email,
                error: r.error || 'Failed'
            }));

        const message =
            summary.failed === 0
                ? `Successfully sent to all ${summary.total} recipient(s).`
                : `Sent ${summary.successful} of ${summary.total} successfully; ${summary.failed} failed.`;

        return res.status(200).json({
            success: true,
            message,
            data: {
                id: sentEmail._id,
                subject: sentEmail.subject,
                total_recipients: summary.total,
                successful_emails,
                failed: failed_recipients,
                summary
            }
        });
    } catch (error) {
        console.error('Send email error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to send email',
                error: error.message
            });
        }
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

// @desc    Get unregistered users (isRegistered: false in Users table)
// @route   GET /api/admin/emails/unregistered
// @access  Private (Admin)
exports.getUnregisteredUsers = async (req, res, next) => {
    try {
        let query = { isRegistered: false };

        // If Org Admin, restrict to their Org
        if (req.user.role === 'admin_org') {
            query.org_id = req.user.org_id;
        }
        // If Super Admin, filter by org_id if a valid one is provided
        else if (req.user.role === 'super_admin' && req.query.org_id && mongoose.isValidObjectId(req.query.org_id)) {
            query.org_id = new mongoose.Types.ObjectId(req.query.org_id);
        }
        // Super Admin without valid org_id — return all unregistered across all orgs

        // Get all users with isRegistered: false for this org
        const unregisteredUsers = await User.find(query)
            .select('email name')
            .lean();

        const unregisteredEmails = unregisteredUsers
            .map(u => u.email)
            .filter(Boolean);

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
