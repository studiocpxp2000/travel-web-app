const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    // Denormalized for performance (snapshot)
    org_name_snapshot: { type: String },

    // Identity
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true // Allows null/undefined to not violate uniqueness
    },
    phone: {
        type: String,
        trim: true,
        sparse: true
    },
    password: {
        type: String,
        select: false // Never return password by default
    },

    // Profile Data (Configurable via Org Settings)
    gender: { type: String, enum: ['male', 'female', 'other'] },
    location: { type: String },
    food_preference: { type: String, enum: ['veg', 'non-veg', 'vegan'] },
    food_remarks: { type: String },

    // Documents (S3 URLs)
    passport_number: { type: String },
    passport_url: { type: String },
    govt_id_number: { type: String },
    govt_id_url: { type: String },
    govt_id_key: { type: String }, // S3 key for deletion

    // Generated Assets
    qr_code_url: { type: String }, // S3 URL to the generated QR image (encodes user email)

    // Application Logic & Status
    isRegistered: {
        type: Boolean,
        default: false,
        index: true
    },

    // Scanner Status Checks (Simplified version of what was in mockData)
    // We might want to move this to a separate "Attendance" collection later, but keeping it simple for now
    status_flags: {
        on_airport: { type: Boolean, default: false },
        on_bus: { type: Boolean, default: false },
        at_hotel: { type: Boolean, default: false },
        session_1: { type: Boolean, default: false },
        session_2: { type: Boolean, default: false },
        session_3: { type: Boolean, default: false },
        session_4: { type: Boolean, default: false },
        session_5: { type: Boolean, default: false },
        session_6: { type: Boolean, default: false },
        session_7: { type: Boolean, default: false },
        session_8: { type: Boolean, default: false },
        session_9: { type: Boolean, default: false }
    },

    // Bookings with S3 integration
    bookings: [{
        type: { type: String, enum: ['flight', 'train', 'bus', 'cab', 'hotel', 'other'] },
        ticket_url: { type: String }, // S3 URL
        ticket_key: { type: String }, // S3 key for deletion
        filename: { type: String },   // Original filename
        uploadedAt: { type: Date, default: Date.now }
    }],


}, {
    timestamps: true
});

// Composite index to ensure unique email per organization
userSchema.index({ org_id: 1, email: 1 }, { unique: true, sparse: true });
userSchema.index({ org_id: 1, phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('User', userSchema);
