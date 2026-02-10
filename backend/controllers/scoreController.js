const Score = require('../models/Score');
const BonusCode = require('../models/BonusCode');
const User = require('../models/User');

// @desc    Get Leaderboard (Public)
// @route   GET /api/scores/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
    try {
        const { org_id } = req.query; // If public, need org_id or slug to filter

        if (!org_id) {
            return res.status(400).json({ success: false, message: 'Organization ID is required' });
        }

        // Fetch Top 50 Users
        const leaderboard = await Score.find({ org_id })
            .sort({ current_score: -1 })
            .limit(50)
            .select('user_name_snapshot user_avatar_url current_score user_id');

        res.status(200).json({ success: true, count: leaderboard.length, data: leaderboard });
    } catch (err) {
        next(err);
    }
};

// @desc    Redeem Bonus Code
// @route   POST /api/scores/redeem
// @access  User
exports.redeemBonusCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        const orgId = req.user.org_id;

        if (!code) {
            return res.status(400).json({ success: false, message: 'Code is required' });
        }

        const bonusCode = await BonusCode.findOne({
            code: code.toUpperCase(),
            org_id: orgId
        });

        if (!bonusCode) {
            return res.status(404).json({ success: false, message: 'Invalid Bonus Code' });
        }

        if (!bonusCode.isActive) {
            return res.status(400).json({ success: false, message: 'Bonus Code is inactive' });
        }

        if (bonusCode.redeemed_by.includes(userId)) {
            return res.status(400).json({ success: false, message: 'Code already redeemed' });
        }

        // Logic Atomic Update or Transaction?
        // Simple sequential update for now

        // 1. Mark Code as Redeemed by User
        bonusCode.redeemed_by.push(userId);
        await bonusCode.save();

        // 2. Update Score
        const scoreEntry = await Score.findOne({ user_id: userId });
        if (scoreEntry) {
            scoreEntry.current_score += bonusCode.points;
            scoreEntry.history.push({
                source: 'BONUS_CODE',
                description: `Redeemed ${bonusCode.code}`,
                points: bonusCode.points
            });
            // Update redeemed codes in Score document
            if (!scoreEntry.redeemed_codes) scoreEntry.redeemed_codes = [];
            scoreEntry.redeemed_codes.push(bonusCode.code);

            await scoreEntry.save();
        } else {
            // Fallback if score doesn't exist (should not happen with proper initialization)
            // ...
        }

        // Removed User.findByIdAndUpdate as redeemed_codes is now in Score

        res.status(200).json({
            success: true,
            message: `Redeemed ${bonusCode.points} points!`,
            data: { pointsAdded: bonusCode.points, newScore: scoreEntry?.current_score }
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get Admin Leaderboard (Full Data)
// @route   GET /api/scores/admin/leaderboard
// @access  Admin
exports.getAdminLeaderboard = async (req, res, next) => {
    try {
        let orgId = req.user.org_id;

        // Super Admin support
        if (req.user.role === 'super_admin') {
            if (req.query.org_id) {
                orgId = req.query.org_id;
            } else if (req.query.org_slug) {
                const org = await Organization.findOne({ slug: req.query.org_slug });
                if (org) orgId = org._id;
            }
        }

        if (!orgId) {
            return res.status(400).json({ success: false, message: 'Organization Context Missing' });
        }

        const leaderboard = await Score.find({ org_id: orgId })
            .sort({ current_score: -1 })
            .populate('user_id', 'name email phone avatar_url'); // Get full user details

        res.status(200).json({ success: true, count: leaderboard.length, data: leaderboard });
    } catch (err) {
        next(err);
    }
};

// @desc    Update User Score (Admin)
// @route   PUT /api/scores/admin/:id
// @access  Admin
exports.updateScore = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { points, reason } = req.body; // absolute points value

        const scoreEntry = await Score.findById(id);

        if (!scoreEntry) {
            return res.status(404).json({ success: false, message: 'Score entry not found' });
        }

        // Check org authorization
        if (req.user.role !== 'super_admin') {
            if (scoreEntry.org_id.toString() !== req.user.org_id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to update this score' });
            }
        }

        const oldScore = scoreEntry.current_score;
        const diff = points - oldScore;

        scoreEntry.current_score = points;
        scoreEntry.history.push({
            source: 'ADMIN_UPDATE',
            description: reason || 'Manual Admin Update',
            points: diff
        });

        await scoreEntry.save();

        res.status(200).json({ success: true, data: scoreEntry });

    } catch (err) {
        next(err);
    }
};

// @desc    Delete/Reset User Score (Admin)
// @route   DELETE /api/scores/admin/:id
// @access  Admin
exports.deleteScore = async (req, res, next) => {
    try {
        const { id } = req.params;

        const scoreEntry = await Score.findById(id);

        if (!scoreEntry) {
            return res.status(404).json({ success: false, message: 'Score entry not found' });
        }

        // Check org authorization
        if (req.user.role !== 'super_admin') {
            if (scoreEntry.org_id.toString() !== req.user.org_id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized to delete this score' });
            }
        }

        // Instead of hard delete, maybe reset? User asked to "manage them like... delete".
        // Deleting the document removes them from leaderboard entirely.
        await scoreEntry.deleteOne();

        res.status(200).json({ success: true, message: 'Score entry deleted', data: {} });

    } catch (err) {
        next(err);
    }
};

// @desc    Create Bonus Code (Admin)
// @route   POST /api/scores/codes
// @access  Admin
exports.createBonusCode = async (req, res, next) => {
    try {
        const { code, points, isActive, org_id } = req.body;
        let orgId = req.user.org_id;

        if (req.user.role === 'super_admin') {
            if (org_id) orgId = org_id;
            else return res.status(400).json({ success: false, message: 'Org ID required for Super Admin' });
        }

        const exists = await BonusCode.findOne({ code, org_id: orgId });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Code already exists' });
        }

        const bonus = await BonusCode.create({
            org_id: orgId,
            code,
            points,
            isActive
        });

        res.status(201).json({ success: true, data: bonus });
    } catch (err) {
        next(err);
    }
};

// @desc    Get All Codes (Admin)
// @route   GET /api/scores/codes
// @access  Admin
exports.getBonusCodes = async (req, res, next) => {
    try {
        let orgId = req.user.org_id;

        if (req.user.role === 'super_admin') {
            if (req.query.org_id) {
                orgId = req.query.org_id;
            } else if (req.query.org_slug) {
                const org = await Organization.findOne({ slug: req.query.org_slug });
                if (org) orgId = org._id;
            }
        }

        if (!orgId) {
            return res.status(400).json({ success: false, message: 'Organization Context Missing' });
        }

        const codes = await BonusCode.find({ org_id: orgId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: codes.length, data: codes });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle Code Status
// @route   PUT /api/scores/codes/:id/toggle
// @access  Admin
exports.toggleBonusCode = async (req, res, next) => {
    try {
        const code = await BonusCode.findById(req.params.id);
        if (!code) return res.status(404).json({ success: false, message: 'Code not found' });

        if (req.user.role !== 'super_admin') {
            if (code.org_id.toString() !== req.user.org_id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        }

        code.isActive = !code.isActive;
        await code.save();

        res.status(200).json({ success: true, data: code });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Code
// @route   DELETE /api/scores/codes/:id
// @access  Admin
exports.deleteBonusCode = async (req, res, next) => {
    try {
        const code = await BonusCode.findById(req.params.id);
        if (!code) return res.status(404).json({ success: false, message: 'Code not found' });

        if (req.user.role !== 'super_admin') {
            if (code.org_id.toString() !== req.user.org_id.toString()) {
                return res.status(403).json({ success: false, message: 'Not authorized' });
            }
        }

        await code.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
