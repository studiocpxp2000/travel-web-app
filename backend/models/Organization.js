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
        primary: { type: String, default: '#3B82F6' },
        secondary: { type: String, default: '#10B981' },
        accent: { type: String, default: '#F59E0B' },
        background: { type: String, default: '#ffffff' },
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
            type: [String],
            default: ['gallery', 'agenda', 'leaderboard', 'support']
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
