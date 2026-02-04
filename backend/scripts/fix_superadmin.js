const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');

const checkSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Assuming username is from env or common 'admin'/'superadmin'
        // Let's just find ALL admins with super admin like roles to be safe

        console.log('Searching for Super Admins...');
        // Regex for case insensitive search
        const supers = await Admin.find({
            $or: [
                { role: 'super_admin' },
                { role: 'SUPER_ADMIN' },
                { username: 'admin' },
                { username: 'superadmin' }
            ]
        });

        if (supers.length === 0) {
            console.log('No Super Admin found!');
        } else {
            for (const admin of supers) {
                console.log(`Found: ${admin.username} (Role: ${admin.role})`);
                if (admin.role !== 'super_admin') {
                    console.log(` -> FIXING role to 'super_admin'...`);
                    admin.role = 'super_admin';
                    await admin.save();
                    console.log(' -> Fixed.');
                }
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkSuperAdmin();
