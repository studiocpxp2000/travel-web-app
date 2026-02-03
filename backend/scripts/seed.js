const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Organization = require('../models/Organization');
const Admin = require('../models/Admin');
const Promoter = require('../models/Promoter');
const User = require('../models/User');
const Score = require('../models/Score');
const BonusCode = require('../models/BonusCode');

// Load environment variables
dotenv.config({ path: '../.env' }); // Adjust path as script is in /scripts

// Mock Data Definition (Copied/Adapted from frontend/src/utils/mockData.js)
const mockOrganizations = [
    {
        name: 'Travel Adventures Inc.',
        slug: 'travel-adventures',
        colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B', header: '#1A1A1A', footer: '#1A1A1A', button: '#3B82F6' },
        settings: { registration_fields: ['name', 'gender', 'email', 'password', 'location', 'food_preference'] }
    },
    {
        name: 'Global Tours Ltd.',
        slug: 'global-tours',
        colors: { primary: '#0F172A', secondary: '#10B981', accent: '#F59E0B', header: '#0F172A', footer: '#0F172A', button: '#10B981' },
        settings: { registration_fields: ['name', 'email', 'password', 'passport', 'govt_id_number'] }
    },
    {
        name: 'Sunset Voyages',
        slug: 'sunset-voyages',
        colors: { primary: '#7C2D12', secondary: '#F59E0B', accent: '#F59E0B', header: '#7C2D12', footer: '#7C2D12', button: '#F59E0B' },
        settings: { registration_fields: ['name', 'email', 'password', 'food_preference', 'food_remarks'] }
    }
];

const mockAdmins = [
    { org_slug: 'travel-adventures', name: 'John Admin', username: 'john', password: 'admin123' },
    { org_slug: 'global-tours', name: 'Sarah Manager', username: 'sarah', password: 'admin123' },
    { org_slug: 'sunset-voyages', name: 'Mike Travel', username: 'mike', password: 'admin123' }
];

const mockPromoters = [
    { org_slug: 'travel-adventures', username: 'arrival1', password: 'scan123', scanner_type: 'ARRIVAL_SCANNER' },
    { org_slug: 'travel-adventures', username: 'session1', password: 'scan123', scanner_type: 'SESSION_1' },
    { org_slug: 'travel-adventures', username: 'session2', password: 'scan123', scanner_type: 'SESSION_2' },
    { org_slug: 'global-tours', username: 'gtarrive', password: 'scan123', scanner_type: 'ARRIVAL_SCANNER' },
    { org_slug: 'global-tours', username: 'gtsession1', password: 'scan123', scanner_type: 'SESSION_1' }
];

const mockUsers = [
    {
        org_slug: 'travel-adventures',
        name: 'Alice Johnson', email: 'alice@example.com', password: 'user123', gender: 'female', location: 'New York, USA',
        passport_number: 'AB1234567', govt_id_number: 'NY-987654321', food_preference: 'veg', food_remarks: 'No nuts please',
        score: 150, isRegistered: false,
        status_flags: { on_airport: false, on_bus: false, at_hotel: false }
    },
    {
        org_slug: 'travel-adventures',
        name: 'Bob Smith', email: 'bob@example.com', password: 'user123', gender: 'male', location: 'Los Angeles, USA',
        govt_id_number: 'CA-123456789', food_preference: 'non-veg',
        score: 300, isRegistered: false,
        status_flags: { on_airport: true, on_bus: true, at_hotel: true, session_1: true }
    },
    {
        org_slug: 'travel-adventures',
        name: 'Carol White', email: 'carol@example.com', password: 'user123', gender: 'female', location: 'Chicago, USA',
        passport_number: 'CD7654321', food_preference: 'veg', food_remarks: 'Gluten free',
        score: 0, isRegistered: true,
        status_flags: { on_airport: true, on_bus: true, at_hotel: true, session_1: true, session_2: true }
    },
    {
        org_slug: 'global-tours',
        name: 'David Brown', email: 'david@example.com', password: 'user123', gender: 'male', location: 'London, UK',
        passport_number: 'UK9876543', govt_id_number: 'UK-555444333',
        score: 0, isRegistered: false
    },
    {
        org_slug: 'global-tours',
        name: 'Emma Davis', email: 'emma@example.com', password: 'user123', gender: 'female', location: 'Paris, France',
        passport_number: 'FR1234567', govt_id_number: 'FR-111222333', food_preference: 'veg',
        score: 0, isRegistered: true,
        status_flags: { on_airport: true }
    }
];

const mockBonusCodes = [
    { org_slug: 'travel-adventures', code: 'WELCOME50', points: 50, isActive: true },
    { org_slug: 'travel-adventures', code: 'SESSION100', points: 100, isActive: false }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/travel-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected for Seeding');

        // Clear existing data
        await Organization.deleteMany({});
        await Admin.deleteMany({});
        await Promoter.deleteMany({});
        await User.deleteMany({});
        await Score.deleteMany({});
        await BonusCode.deleteMany({});
        console.log('Data Cleared');

        // 1. Create Organizations
        const orgMap = {};
        for (const orgData of mockOrganizations) {
            const org = await Organization.create(orgData);
            orgMap[org.slug] = org;
            console.log(`Created Org: ${org.name}`);
        }

        // 2. Create Admins
        for (const adminData of mockAdmins) {
            const org = orgMap[adminData.org_slug];
            if (org) {
                await Admin.create({
                    ...adminData,
                    org_id: org._id
                });
                console.log(`Created Admin: ${adminData.username}`);
            }
        }

        // 3. Create Promoters
        for (const promoData of mockPromoters) {
            const org = orgMap[promoData.org_slug];
            if (org) {
                await Promoter.create({
                    ...promoData,
                    org_id: org._id
                });
                console.log(`Created Promoter: ${promoData.username}`);
            }
        }

        // 4. Create Users & Scores
        for (const userData of mockUsers) {
            const org = orgMap[userData.org_slug];
            if (org) {
                // Generate QR Data
                // Use a temporary Object ID for now or create generic
                const tempId = new mongoose.Types.ObjectId();
                const qrData = `QR-${org.slug.toUpperCase()}-${tempId.toString().slice(-6).toUpperCase()}`;

                const user = await User.create({
                    _id: tempId,
                    ...userData,
                    org_id: org._id,
                    org_name_snapshot: org.name,
                    qr_data: qrData,
                    qr_code_url: `https://placeholder-qr.com/${qrData}` // Mock URL
                });

                // Create Score
                await Score.create({
                    user_id: user._id,
                    org_id: org._id,
                    user_name_snapshot: user.name,
                    user_email_snapshot: user.email,
                    current_score: userData.score || 0,
                    history: userData.score ? [{ source: 'MOCK_IMPORT', points: userData.score, description: 'Initial Import' }] : []
                });

                console.log(`Created User: ${user.name}`);
            }
        }

        // 5. Create Bonus Codes
        for (const bonusData of mockBonusCodes) {
            const org = orgMap[bonusData.org_slug];
            if (org) {
                await BonusCode.create({
                    ...bonusData,
                    org_id: org._id
                });
                console.log(`Created Bonus Code: ${bonusData.code}`);
            }
        }

        console.log('Database Seeding Completed Successfully');
        process.exit();

    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedDatabase();
