const Organization = require('../models/Organization');

// @desc    Update Agenda (Admin)
// Stored in Organization Settings/Data for now as it's structurally complex
// @route   PUT /api/content/agenda
// @access  Admin
exports.updateAgenda = async (req, res, next) => {
    try {
        const org = await Organization.findByIdAndUpdate(req.user.org_id, {
            $set: { 'content.agenda': req.body }
        }, { new: true, upsert: true });

        res.status(200).json({ success: true, data: req.body });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Agenda (Public)
// @route   GET /api/content/agenda
// @access  Public
exports.getAgenda = async (req, res, next) => {
    try {
        const { org_id } = req.query;
        const org = await Organization.findById(org_id).select('content.agenda');

        if (!org || !org.content?.agenda) {
            return res.status(404).json({ success: false, message: 'Agenda not found' });
        }
        res.status(200).json({ success: true, data: org.content.agenda });
    } catch (err) {
        next(err);
    }
};
