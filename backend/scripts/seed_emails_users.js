/**
 * Seed Script: Create 20 Users per Org and Sample SentEmails
 * Run: node scripts/seed_emails_users.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Admin = require('../models/Admin');
const SentEmail = require('../models/SentEmail');
const Score = require('../models/Score');

// Generate random users
const generateUsers = (count) => {
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'];

    const users = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}`;

        users.push({
            name: `${firstName} ${lastName}`,
            email: `${emailPrefix}@example.com`,
            phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            gender: Math.random() > 0.5 ? 'male' : 'female',
            location: cities[Math.floor(Math.random() * cities.length)]
        });
    }
    return users;
};

// Generate sample sent emails
const generateSentEmails = (orgId, adminId, userEmails) => {
    const subjects = [
        'Welcome to Our Event!',
        'Registration Confirmation',
        'Event Reminder - Don\'t Miss Out!',
        'Special Announcement',
        'Your Invitation Inside',
        'Important Update about the Event',
        'Thank You for Registering',
        'Event Schedule Released',
        'Last Chance to Register!',
        'Event Details and FAQs'
    ];

    const emails = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
        const recipientCount = Math.floor(Math.random() * 15) + 5;
        const selectedEmails = userEmails.slice(0, recipientCount);

        const sentDate = new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days

        emails.push({
            org_id: orgId,
            subject: subjects[i],
            html_content: `<h1>${subjects[i]}</h1><p>This is sample email content for testing purposes.</p><p>Thank you for being part of our event!</p>`,
            recipients: selectedEmails.map(email => ({
                email,
                status: Math.random() > 0.1 ? 'sent' : 'failed',
                sent_at: sentDate
            })),
            cc: [],
            bcc: [],
            sent_by: adminId,
            total_recipients: selectedEmails.length,
            successful_sends: selectedEmails.filter(() => Math.random() > 0.1).length,
            failed_sends: Math.floor(Math.random() * 2),
            status: 'completed',
            createdAt: sentDate,
            updatedAt: sentDate
        });
    }
    return emails;
};

const seedData = async () => {
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
        let totalEmailsCreated = 0;

        for (const org of organizations) {
            console.log(`\n📂 Processing organization: ${org.name} (${org.slug})`);

            // Get admin for this org
            const admin = await Admin.findOne({ org_id: org._id });
            if (!admin) {
                console.log(`   ⚠️ No admin found for org, skipping sent emails`);
            }

            // Check existing users count
            const existingUserCount = await User.countDocuments({ org_id: org._id });
            console.log(`   📊 Existing users: ${existingUserCount}`);

            // Generate more users if needed
            const usersNeeded = Math.max(0, 20 - existingUserCount);
            if (usersNeeded > 0) {
                const newUsers = generateUsers(usersNeeded);

                for (const userData of newUsers) {
                    // Ensure unique email per org
                    const existingUser = await User.findOne({ email: userData.email, org_id: org._id });
                    if (existingUser) continue;

                    const user = new User({
                        org_id: org._id,
                        org_name_snapshot: org.name,
                        name: userData.name,
                        email: userData.email,
                        phone: userData.phone,
                        gender: userData.gender,
                        location: userData.location,
                        password: 'user123',
                        qr_data: `QR-${org.slug.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
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

                    totalUsersCreated++;
                }
                console.log(`   ✅ Created ${usersNeeded} new users`);
            } else {
                console.log(`   ⏭️ Already has 20+ users`);
            }

            // Get all user emails for this org
            const orgUsers = await User.find({ org_id: org._id }).select('email');
            const userEmails = orgUsers.map(u => u.email);

            // Check existing sent emails
            const existingEmailCount = await SentEmail.countDocuments({ org_id: org._id });
            if (existingEmailCount > 0) {
                console.log(`   ⏭️ Already has ${existingEmailCount} sent emails`);
                continue;
            }

            // Create sent emails
            if (admin) {
                const sentEmails = generateSentEmails(org._id, admin._id, userEmails);
                await SentEmail.insertMany(sentEmails);
                totalEmailsCreated += sentEmails.length;
                console.log(`   ✅ Created ${sentEmails.length} sent emails`);
            }
        }

        console.log('\n========================================');
        console.log('✅ Seeding complete!');
        console.log(`   Users created: ${totalUsersCreated}`);
        console.log(`   Sent Emails created: ${totalEmailsCreated}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the seed
seedData();
