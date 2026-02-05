const mongoose = require('mongoose');

const SentEmailSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    html_content: {
        type: String,
        required: [true, 'Email content is required']
    },
    recipients: [{
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'bounced'],
            default: 'pending'
        },
        sent_at: Date,
        error: String
    }],
    cc: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    bcc: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    sent_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    total_recipients: {
        type: Number,
        default: 0
    },
    successful_sends: {
        type: Number,
        default: 0
    },
    failed_sends: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'sending', 'completed', 'failed'],
        default: 'sending'
    }
}, {
    timestamps: true
});

// Index for querying sent emails by org
SentEmailSchema.index({ org_id: 1, createdAt: -1 });

// Index for finding unregistered emails
SentEmailSchema.index({ 'recipients.email': 1, org_id: 1 });

module.exports = mongoose.model('SentEmail', SentEmailSchema);
