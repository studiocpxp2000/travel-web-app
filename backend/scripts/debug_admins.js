const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');
const Organization = require('../models/Organization');

const debugAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        console.log('--- Fetching All Admins ---');
        const admins = await Admin.find({});
        console.log(`Found ${admins.length} admins.`);

        for (const admin of admins) {
            console.log(`\nAdmin: ${admin.username} (${admin._id})`);
            console.log(`  Role: ${admin.role}`);
            console.log(`  Org ID (Raw): ${admin.org_id}`);

            // Try explicit populate
            const populated = await Admin.findById(admin._id).populate('org_id');
            console.log(`  Populated Org: ${populated.org_id ? populated.org_id.name : 'NULL (Populate Failed)'}`);

            if (!populated.org_id) {
                // Check if org exists raw
                const org = await Organization.findById(admin.org_id);
                console.log(`    -> Orphaned? Org lookup by ID ${admin.org_id} returned: ${org ? 'Found' : 'NOT FOUND'}`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

debugAdmins();
