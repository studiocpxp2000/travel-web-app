const mongoose = require('mongoose');

const feedbackSettingsSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        unique: true
    },
    is_enabled: {
        type: Boolean,
        default: false
    },
    questions: [{
        id: { type: String, required: true },
        text: { type: String, required: true },
        type: { type: String, enum: ['text', 'rating'], required: true },
        order: { type: Number, default: 0 }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('FeedbackSettings', feedbackSettingsSchema);
