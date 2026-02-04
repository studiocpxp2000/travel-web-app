const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');

const seedAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('--- Resetting Admin Passwords to Plain Text ---');

        const admins = await Admin.find({});
        console.log(`Found ${admins.length} admins to update.`);

        // Known passwords for restoration
        const knownPasswords = {
            'john': 'admin123',
            'sarah': 'admin123',
            'mike': 'admin123',
            'demo': 'admin123',
            'superadmin': 'superadmin123', // if exists in db
            'admin': 'admin123'
        };

        const DEFAULT_PASS = 'reset123';

        for (const admin of admins) {
            // Determine plain text password
            // If we have a known one, use it. Otherwise reset to default.
            let plainText = knownPasswords[admin.username] || DEFAULT_PASS;

            console.log(`Processing ${admin.username}...`);
            console.log(`  -> Setting plain_password to: '${plainText}'`);

            // Set fields
            admin.plain_password = plainText;
            admin.password = plainText; // This will be hashed by pre-save hook

            // Normalize Role just in case
            if (admin.role === 'SUPER_ADMIN') admin.role = 'super_admin';
            if (admin.role === 'ADMIN_ORG') admin.role = 'admin_org';

            await admin.save();
            console.log(`  -> Saved. Password hashed, Plain stored.`);
        }

        console.log('Admins update complete.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

seedAdmins();
