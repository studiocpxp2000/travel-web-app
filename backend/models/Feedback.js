const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    user_name: {
        type: String,
        default: 'Anonymous'
    },
    user_email: {
        type: String,
        default: null
    },
    responses: [{
        question_id: { type: String },
        question_text: { type: String, required: true },
        type: { type: String, enum: ['text', 'rating'] },
        answer: { type: mongoose.Schema.Types.Mixed, required: true } // Can be String or Number
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema);
