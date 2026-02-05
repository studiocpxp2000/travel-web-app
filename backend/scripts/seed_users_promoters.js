/**
 * Seed Script: Create test Users and Promoters for each Organization
 * Run: node scripts/seed_users_promoters.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Promoter = require('../models/Promoter');
const Score = require('../models/Score');

const sampleUsers = [
    { name: 'John Doe', email: 'john.doe@example.com', phone: '+1234567890', gender: 'male', location: 'New York' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1234567891', gender: 'female', location: 'Los Angeles' },
    { name: 'Robert Johnson', email: 'robert.j@example.com', phone: '+1234567892', gender: 'male', location: 'Chicago' },
    { name: 'Emily Davis', email: 'emily.d@example.com', phone: '+1234567893', gender: 'female', location: 'Houston' },
    { name: 'Michael Brown', email: 'michael.b@example.com', phone: '+1234567894', gender: 'male', location: 'Phoenix' },
];

const samplePromoters = [
    { username: 'promo_arrival', password: 'promo123', scanner_type: 'ARRIVAL_SCANNER' },
    { username: 'promo_session1', password: 'promo123', scanner_type: 'SESSION_1' },
    { username: 'promo_session2', password: 'promo123', scanner_type: 'SESSION_2' },
];

const seedUsersAndPromoters = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all organizations
        const organizations = await Organization.find();
        console.log(`📦 Found ${organizations.length} organizations`);

        if (organizations.length === 0) {
            console.log('❌ No organizations found. Please create organizations first.');
            process.exit(1);
        }

        let totalUsersCreated = 0;
        let totalPromotersCreated = 0;

        for (const org of organizations) {
            console.log(`\n📂 Processing organization: ${org.name} (${org.slug})`);

            // Create Users
            for (const userData of sampleUsers) {
                // Check if user with this email already exists in this org
                const existingUser = await User.findOne({ email: userData.email, org_id: org._id });
                if (existingUser) {
                    console.log(`   ⏭️ User ${userData.email} already exists, skipping`);
                    continue;
                }

                // Create user
                const user = new User({
                    org_id: org._id,
                    org_name_snapshot: org.name,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    gender: userData.gender,
                    location: userData.location,
                    password: 'user123',
                    qr_data: `QR-${org.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`
                });

                await user.save();

                // Create score record
                await Score.create({
                    user_id: user._id,
                    org_id: org._id,
                    user_name_snapshot: user.name,
                    user_email_snapshot: user.email,
                    current_score: Math.floor(Math.random() * 500)
                });

                console.log(`   ✅ Created user: ${userData.name}`);
                totalUsersCreated++;
            }

            // Create Promoters
            for (const promoData of samplePromoters) {
                const uniqueUsername = `${promoData.username}_${org.slug}`;

                // Check if promoter already exists
                const existingPromo = await Promoter.findOne({ username: uniqueUsername });
                if (existingPromo) {
                    console.log(`   ⏭️ Promoter ${uniqueUsername} already exists, skipping`);
                    continue;
                }

                await Promoter.create({
                    org_id: org._id,
                    username: uniqueUsername,
                    password: promoData.password,
                    scanner_type: promoData.scanner_type
                });

                console.log(`   ✅ Created promoter: ${uniqueUsername}`);
                totalPromotersCreated++;
            }
        }

        console.log('\n========================================');
        console.log('✅ Seeding complete!');
        console.log(`   Users created: ${totalUsersCreated}`);
        console.log(`   Promoters created: ${totalPromotersCreated}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the seed
seedUsersAndPromoters();
