const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        trim: true
    },
    level: {
        type: String,
        enum: ['neutral', 'positive', 'info', 'warning', 'negative'],
        default: 'info'
    },
    type: {
        type: String,
        enum: ['web', 'mobile'],
        default: 'web'
    },
    // Optional: Target specific users or groups? For now broadcast to org.
    // target_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    expiresAt: { type: Date }, // Optional TTL
    redirectUrl: { type: String, default: null } // Optional navigation target when clicked
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
