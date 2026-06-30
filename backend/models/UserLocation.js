const mongoose = require('mongoose');

const userLocationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Assuming one location document per user
        index: true
    },
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String },
    lastUpdated: { type: Date }
}, {
    timestamps: true
});

// Geospatial index for location
userLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('UserLocation', userLocationSchema);
