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

        // Attach Admin details to each org
        const orgsWithAdmin = await Promise.all(orgs.map(async (org) => {
            const admin = await Admin.findOne({ org_id: org._id }).select('username plain_password');
            const orgObj = org.toObject();
            if (admin) {
                orgObj.admin = {
                    username: admin.username,
                    password: admin.plain_password || '******' // Show plain if available
                };
            }
            return orgObj;
        }));

        res.status(200).json({ success: true, count: orgsWithAdmin.length, data: orgsWithAdmin });
    } catch (err) {
        next(err);
    }
};

// ... (updateOrganization and deleteOrganization remain unchanged) ...

// @desc    Update organization
// @route   PUT /api/admin/organizations/:id
// @access  Super Admin
exports.updateOrganization = async (req, res, next) => {
    try {
        const org = await Organization.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        res.status(200).json({ success: true, data: org });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete organization
// @route   DELETE /api/admin/organizations/:id
// @access  Super Admin
exports.deleteOrganization = async (req, res, next) => {
    try {
        const org = await Organization.findByIdAndDelete(req.params.id);

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Also delete associated Admin
        await Admin.deleteOne({ org_id: req.params.id });

        res.status(200).json({ success: true, data: {} });
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

        // Check if username exists globally
        const userExists = await Admin.findOne({ username });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const admin = await Admin.create({
            name,
            username,
            password,
            plain_password: password, // Store plain for reference
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

        // Calculate session stats for sessions 1-9
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

// @desc    Get All Promoters
// @route   GET /api/admin/promoters
// @access  Admin (Scoped to Org)
exports.getPromoters = async (req, res, next) => {
    try {
        const org_id = req.user.org_id;
        const promoters = await Promoter.find({ org_id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: promoters.length, data: promoters });
    } catch (err) {
        next(err);
    }
};

// @desc    Create Promoter
// @route   POST /api/admin/promoters
// @access  Admin (Scoped to Org)
exports.createPromoter = async (req, res, next) => {
    try {
        const org_id = req.user.org_id;
        const { username, password, scanner_type } = req.body;

        const promoterExists = await Promoter.findOne({ username });
        if (promoterExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const promoter = await Promoter.create({
            org_id,
            username,
            password,
            scanner_type
        });

        res.status(201).json({ success: true, data: promoter });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Promoter
// @route   PUT /api/admin/promoters/:id
// @access  Admin (Scoped to Org)
exports.updatePromoter = async (req, res, next) => {
    try {
        const { username, password, scanner_type } = req.body;
        const promoter = await Promoter.findById(req.params.id);

        if (!promoter) {
            return res.status(404).json({ success: false, message: 'Promoter not found' });
        }

        // Ensure scoped to org
        if (promoter.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this promoter' });
        }

        promoter.username = username || promoter.username;
        if (password) promoter.password = password;
        if (scanner_type) promoter.scanner_type = scanner_type;

        await promoter.save();

        res.status(200).json({ success: true, data: promoter });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Promoter
// @route   DELETE /api/admin/promoters/:id
// @access  Admin (Scoped to Org)
exports.deletePromoter = async (req, res, next) => {
    try {
        const promoter = await Promoter.findById(req.params.id);

        if (!promoter) {
            return res.status(404).json({ success: false, message: 'Promoter not found' });
        }

        // Ensure scoped to org
        if (promoter.org_id.toString() !== req.user.org_id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this promoter' });
        }

        await promoter.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Public Organizations
// @route   GET /api/admin/public/organizations
// @access  Public
exports.getPublicOrganizations = async (req, res, next) => {
    try {
        // Return only necessary public fields
        const orgs = await Organization.find().select('name slug logo colors');
        res.status(200).json({ success: true, count: orgs.length, data: orgs });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Organization by Slug (Public)
// @route   GET /api/admin/public/organizations/:slug
// @access  Public
exports.getOrganizationBySlug = async (req, res, next) => {
    try {
        const org = await Organization.findOne({ slug: req.params.slug }).select('name slug logo colors settings registration_fields');

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        res.status(200).json({ success: true, data: org });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Admins (Super Admin)
// @route   GET /api/admin/admins
// @access  Super Admin
exports.getAllAdmins = async (req, res, next) => {
    try {
        const admins = await Admin.find().populate('org_id', 'name slug').select('+plain_password');
        res.status(200).json({ success: true, count: admins.length, data: admins });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Admin (Super Admin)
// @route   PUT /api/admin/admins/:id
// @access  Super Admin
exports.updateAdmin = async (req, res, next) => {
    try {
        const { name, username, password, org_id } = req.body;
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (name) admin.name = name;
        if (username && username !== admin.username) {
            const exists = await Admin.findOne({ username });
            if (exists) return res.status(400).json({ success: false, message: 'Username already taken' });
            admin.username = username;
        }
        if (password) {
            admin.password = password;
            admin.plain_password = password; // Keep synced
        }
        if (org_id) admin.org_id = org_id;

        await admin.save();

        // Populate org for response
        await admin.populate('org_id', 'name slug');

        res.status(200).json({ success: true, data: admin });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Admin (Super Admin)
// @route   DELETE /api/admin/admins/:id
// @access  Super Admin
exports.deleteAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findByIdAndDelete(req.params.id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Organization by ID
// @route   GET /api/admin/organizations/:id
// @access  Admin/SuperAdmin
exports.getOrganizationById = async (req, res, next) => {
    try {
        const org = await Organization.findById(req.params.id);

        if (!org) {
            return res.status(404).json({ success: false, message: 'Organization not found' });
        }

        // Check permission if not super admin
        if (req.user.role !== 'super_admin' && req.user.org_id.toString() !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this organization' });
        }

        res.status(200).json({ success: true, data: org });
    } catch (err) {
        next(err);
    }
};
