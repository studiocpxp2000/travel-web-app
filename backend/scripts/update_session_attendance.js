/**
 * Update Script: Add session attendance to existing users
 * Run: node scripts/update_session_attendance.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const updateSessionAttendance = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all users
        const users = await User.find();
        console.log(`📦 Found ${users.length} users`);

        let updated = 0;

        for (const user of users) {
            // Randomly set some attendance flags to simulate real data
            const randomAttendance = {
                'status_flags.at_hotel': Math.random() > 0.3, // 70% chance arrived at hotel
                'status_flags.on_airport': Math.random() > 0.5,
                'status_flags.on_bus': Math.random() > 0.6,
                'status_flags.session_1': Math.random() > 0.2, // 80% chance for session 1
                'status_flags.session_2': Math.random() > 0.3,
                'status_flags.session_3': Math.random() > 0.4,
                'status_flags.session_4': Math.random() > 0.5,
                'status_flags.session_5': Math.random() > 0.6,
                'status_flags.session_6': Math.random() > 0.7,
                'status_flags.session_7': Math.random() > 0.8,
                'status_flags.session_8': Math.random() > 0.85,
                'status_flags.session_9': Math.random() > 0.9
            };

            await User.findByIdAndUpdate(user._id, { $set: randomAttendance });
            updated++;
        }

        console.log('\n========================================');
        console.log('✅ Update complete!');
        console.log(`   Updated: ${updated} users with session attendance`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Update failed:', error);
        process.exit(1);
    }
};

// Run the update
updateSessionAttendance();
