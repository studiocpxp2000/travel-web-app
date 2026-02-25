const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    logo_url: {
        type: String, // stored in S3
        default: null
    },
    // Theme Colors
    colors: {
        header: { type: String, default: '#1A1A1A' },
        footer: { type: String, default: '#1A1A1A' },
        button: { type: String, default: '#3B82F6' }
    },
    // Configuration Settings
    settings: {
        registration_fields: {
            type: [String],
            default: ['name', 'email', 'password', 'gender', 'location']
        },
        features: {
            wall_enabled: { type: Boolean, default: false },
            wall_upload_enabled: { type: Boolean, default: false },
            live_engagement_enabled: { type: Boolean, default: false }
        },
        quizzes: [{
            title: { type: String, required: true, trim: true },
            url: { type: String, required: true, trim: true },
            isActive: { type: Boolean, default: true }
        }]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
