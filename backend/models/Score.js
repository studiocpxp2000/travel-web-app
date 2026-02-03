const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One score document per user
        index: true
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Snapshot Data (Denormalized for Leaderboard Speed)
    user_name_snapshot: { type: String },
    user_email_snapshot: { type: String },
    user_avatar_url: { type: String },

    current_score: {
        type: Number,
        default: 0,
        index: -1 // Descending index for fast leaderboard sorting
    },

    // Detailed Point History
    history: [{
        source: { type: String, required: true }, // e.g., 'BONUS_CODE', 'ACTIVITY_WIN'
        description: { type: String },           // e.g., 'Redeemed WELCOME50'
        points: { type: Number, required: true }, // Can be positive or negative
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Add compound index for fast "Leaderboard per Org" queries
scoreSchema.index({ org_id: 1, current_score: -1 });

module.exports = mongoose.model('Score', scoreSchema);
