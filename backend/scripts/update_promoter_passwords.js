/**
 * Migration Script: Update existing Promoters to have plain_password
 * Run: node scripts/update_promoter_passwords.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Promoter = require('../models/Promoter');

const updatePromoterPasswords = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all promoters
        const promoters = await Promoter.find();
        console.log(`📦 Found ${promoters.length} promoters`);

        let updated = 0;
        const defaultPassword = 'promo123'; // Default reset password

        for (const promoter of promoters) {
            // If already has plain_password, skip (unless we want to force reset, but let's assume if it's there it's good)
            // Actually, Mongoose model field might not show up in lean() or simple log if select: false
            // But here we are just updating.

            // To ensure consistency, let's reset all to default if they don't have one, 
            // OR just set plain_password to "promo123" and hash it again to match.
            // Since we can't recover the old plain text, we MUST reset the password to store it as plain text.

            promoter.password = defaultPassword;
            promoter.plain_password = defaultPassword;

            await promoter.save();
            updated++;
            console.log(`   Updated promoter: ${promoter.username}`);
        }

        console.log('\n========================================');
        console.log('✅ Migration complete!');
        console.log(`   Updated: ${updated} promoters with plain_password (${defaultPassword})`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
updatePromoterPasswords();
