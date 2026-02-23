const mongoose = require('mongoose');

const wallPostSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Denormalized for display performance (like GalleryItem / Score patterns)
    user_name_snapshot: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String, // S3 URL
        required: true
    },
    s3_key: {
        type: String, // S3 key for direct deletion
        required: true
    },
    is_moderator: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('WallPost', wallPostSchema);
