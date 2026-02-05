const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const promoterSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
        minlength: 6
    },
    plain_password: {
        type: String, // Stored for Admin reference
        select: false
    },
    // The specific role/station this promoter is responsible for
    scanner_type: {
        type: String,
        required: true,
        enum: [
            'ARRIVAL_SCANNER',
            'SESSION_1',
            'SESSION_2',
            'SESSION_3',
            'SESSION_4',
            'SESSION_5',
            'SESSION_6',
            'SESSION_7',
            'SESSION_8',
            'SESSION_9'
        ]
    },
    last_active: {
        type: Date
    }
}, {
    timestamps: true
});

// Encrypt password using bcrypt
promoterSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

promoterSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Promoter', promoterSchema);
