const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
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
        select: false, // Do not return by default
        minlength: 6
    },
    plain_password: {
        type: String, // Stored for Super Admin reference
        select: false
    },
    role: {
        type: String,
        default: 'admin_org', // Org Admin
        enum: ['admin_org'] // Super Admin is NOT in DB, handled via Env
    },
}, {
    timestamps: true
});

// Encrypt password using bcrypt
adminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
