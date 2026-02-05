const SentEmail = require('../models/SentEmail');
const User = require('../models/User');

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
        const org_id = req.user.org_id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const emails = await SentEmail.find({ org_id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('subject total_recipients successful_sends failed_sends status createdAt');

        const total = await SentEmail.countDocuments({ org_id });

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
        const org_id = req.user.org_id;

        // Get all unique emails from sent emails for this org
        const sentEmails = await SentEmail.aggregate([
            { $match: { org_id: org_id } },
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
        const registeredUsers = await User.find({ org_id })
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
        const org_id = req.user.org_id;
        const email = await SentEmail.findOne({ _id: req.params.id, org_id })
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
