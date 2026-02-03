const Organization = require('../models/Organization');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Promoter = require('../models/Promoter');

// @desc    Create a new Organization
// @route   POST /api/admin/organizations
// @access  Super Admin
exports.createOrganization = async (req, res, next) => {
    try {
        const { name, slug, colors, settings } = req.body;

        const orgExists = await Organization.findOne({ slug });
        if (orgExists) {
            return res.status(400).json({ success: false, message: 'Organization with this slug already exists' });
        }

        const org = await Organization.create({
            name,
            slug,
            colors,
            settings
        });

        res.status(201).json({ success: true, data: org });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Organizations
// @route   GET /api/admin/organizations
// @access  Super Admin
exports.getOrganizations = async (req, res, next) => {
    try {
        const orgs = await Organization.find();
        res.status(200).json({ success: true, count: orgs.length, data: orgs });
    } catch (err) {
        next(err);
    }
};

// @desc    Create an Admin for an Organization
// @route   POST /api/admin/admins
// @access  Super Admin
exports.createOrgAdmin = async (req, res, next) => {
    try {
        const { name, username, password, org_id } = req.body;

        // Check if username exists globally (or per org? Schema says unique globally)
        const userExists = await Admin.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const admin = await Admin.create({
            name,
            username,
            password,
            org_id,
            role: 'admin_org'
        });

        res.status(201).json({ success: true, data: admin });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Dashboard Stats
// @route   GET /api/admin/dashboard-stats
// @access  Admin (Scoped to Org) or Super Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        const org_id = req.user.org_id; // From auth middleware

        if (!org_id && req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Organization context missing' });
        }

        let filter = {};
        if (org_id) {
            filter = { org_id };
        }

        const stats = {
            totalUsers: await User.countDocuments(filter),
            arrivedUsers: await User.countDocuments({ ...filter, 'status_flags.at_hotel': true }),
            totalPromoters: await Promoter.countDocuments(filter),
            sessions: []
        };

        // Calculate session stats
        // We have sessions 1-9 in Schema
        for (let i = 1; i <= 9; i++) {
            const key = `status_flags.session_${i}`;
            const count = await User.countDocuments({ ...filter, [key]: true });
            stats.sessions.push({ session: i, attended: count });
        }

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
};
