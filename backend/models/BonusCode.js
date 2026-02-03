const mongoose = require('mongoose');

const bonusCodeSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Track who used it to prevent double usage if code is single-use per user
    redeemed_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Compound index to ensure unique codes within an organization
bonusCodeSchema.index({ org_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('BonusCode', bonusCodeSchema);
