const mongoose = require('mongoose');
const FeedbackSettings = require('../models/FeedbackSettings');
const Feedback = require('../models/Feedback');
const Organization = require('../models/Organization');
const User = require('../models/User');
const excelJS = require('exceljs');

const resolveOrg = async (req) => {
    if (req.user.role === 'super_admin') {
        const slug = req.query.orgSlug || req.query.org_slug || req.body?.orgSlug || req.body?.org_slug;
        if (slug) return await Organization.findOne({ slug });
        if (req.body?.org_id) return await Organization.findById(req.body.org_id);
        if (req.query.orgId) return await Organization.findById(req.query.orgId);
        return null;
    }
    return await Organization.findById(req.user.org_id);
};

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

// @desc    Get Feedback Settings
// @route   GET /api/feedback/admin/settings
// @access  Private (Admin/SuperAdmin)
exports.getSettings = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        const orgId = org._id;

        let settings = await FeedbackSettings.findOne({ org_id: orgId });
        if (!settings) {
            // Create default settings if none exist
            settings = await FeedbackSettings.create({
                org_id: orgId,
                is_enabled: false,
                questions: []
            });
        }

        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Feedback Settings
// @route   PUT /api/feedback/admin/settings
// @access  Private (Admin/SuperAdmin)
exports.updateSettings = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        const orgId = org._id;
        const { is_enabled, questions } = req.body;

        let settings = await FeedbackSettings.findOne({ org_id: orgId });
        if (!settings) {
            settings = new FeedbackSettings({ org_id: orgId });
        }

        settings.is_enabled = is_enabled !== undefined ? is_enabled : settings.is_enabled;

        if (questions) {
            // Sort questions based on order if provided, or preserve array order
            settings.questions = questions.map((q, index) => ({
                id: q.id || new mongoose.Types.ObjectId().toString(),
                text: q.text,
                type: q.type,
                order: q.order !== undefined ? q.order : index
            }));
        }

        await settings.save();
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Paginated Feedback Responses
// @route   GET /api/feedback/admin/responses
// @access  Private (Admin/SuperAdmin)
exports.getResponses = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        const orgId = org._id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const totalItems = await Feedback.countDocuments({ org_id: orgId });
        const feedbacks = await Feedback.find({ org_id: orgId })
            .sort('-createdAt')
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: feedbacks,
            pagination: {
                totalActive: totalItems, // matching frontend expectations
                totalPages: Math.ceil(totalItems / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Download Feedback Report (Excel)
// @route   GET /api/feedback/admin/download
// @access  Private (Admin/SuperAdmin)
exports.downloadReport = async (req, res, next) => {
    try {
        const org = await resolveOrg(req);
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }
        const orgId = org._id;

        // 1. Get settings to know the questions (for columns)
        const settings = await FeedbackSettings.findOne({ org_id: orgId });
        const questions = settings ? settings.questions.sort((a, b) => a.order - b.order) : [];

        // 2. Get all feedbacks
        const feedbacks = await Feedback.find({ org_id: orgId }).sort('createdAt');

        // 3. Setup Excel Workbook
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Feedback Report');

        // Define columns
        const columns = [
            { header: 'Submission Date', key: 'date', width: 25 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
        ];

        // Add question columns
        questions.forEach((q, index) => {
            columns.push({ header: `Q${index + 1}: ${q.text}`, key: q.id, width: 35 });
        });

        worksheet.columns = columns;
        worksheet.getRow(1).font = { bold: true };

        // 4. Add Data
        feedbacks.forEach(fb => {
            const rowData = {
                date: new Date(fb.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                name: fb.user_name || 'Anonymous',
                email: fb.user_email || 'N/A',
            };

            // Map responses
            if (fb.responses) {
                fb.responses.forEach(res => {
                    const value = res.type === 'rating' ? `${res.answer} / 5` : res.answer;
                    // match by question_id or fallback to question_text roughly
                    const q = questions.find(q => q.id === res.question_id || q.text === res.question_text);
                    if (q) {
                        rowData[q.id] = value;
                    }
                });
            }

            worksheet.addRow(rowData);
        });

        // 5. Send Response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + 'feedback-report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        next(err);
    }
};

// ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────────

// @desc    Get Feedback Form (Public)
// @route   GET /api/feedback/public/:org_slug
// @access  Public
exports.getPublicForm = async (req, res, next) => {
    try {
        const { org_slug } = req.params;
        const org = await Organization.findOne({ slug: org_slug });

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const settings = await FeedbackSettings.findOne({ org_id: org._id });

        if (!settings || !settings.is_enabled) {
            return res.status(403).json({ success: false, message: 'Feedback is not currently accepting responses.' });
        }

        // Return only what the public needs
        res.status(200).json({
            success: true,
            data: {
                orgName: org.name,
                buttonColor: org.colors?.button || '#3B82F6',
                questions: settings.questions.sort((a, b) => a.order - b.order)
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Submit Feedback (Public)
// @route   POST /api/feedback/public/:org_slug/submit
// @access  Public
exports.submitFeedback = async (req, res, next) => {
    try {
        const { org_slug } = req.params;
        const { name, email, responses, user_id } = req.body;

        const org = await Organization.findOne({ slug: org_slug });
        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        const settings = await FeedbackSettings.findOne({ org_id: org._id });
        if (!settings || !settings.is_enabled) {
            return res.status(403).json({ success: false, message: 'Feedback is closed.' });
        }

        // Check if user has already submitted
        if (user_id) {
            const existingFeedback = await Feedback.findOne({ org_id: org._id, user_id });
            if (existingFeedback) {
                return res.status(400).json({ success: false, message: 'You have already submitted feedback for this event.' });
            }
        }

        // Create feedback entry
        const feedback = await Feedback.create({
            org_id: org._id,
            user_id: user_id || null,
            user_name: name || 'Anonymous',
            user_email: email || null,
            responses: responses || []
        });

        res.status(201).json({ success: true, data: feedback });
    } catch (err) {
        next(err);
    }
};

// @desc    Update a specific feedback response
// @route   PUT /api/feedback/admin/responses/:id
// @access  Private (Admin/SuperAdmin)
exports.updateFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { responses } = req.body;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        // Verify org context
        const org = await resolveOrg(req);
        if (!org || feedback.org_id.toString() !== org._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this feedback' });
        }

        feedback.responses = responses || feedback.responses;
        await feedback.save();

        res.status(200).json({ success: true, data: feedback });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a specific feedback response
// @route   DELETE /api/feedback/admin/responses/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;

        const feedback = await Feedback.findById(id);
        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found' });
        }

        // Verify org context
        const org = await resolveOrg(req);
        if (!org || feedback.org_id.toString() !== org._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized access to this feedback' });
        }

        await feedback.deleteOne();

        res.status(200).json({ success: true, message: 'Feedback deleted successfully' });
    } catch (err) {
        next(err);
    }
};
