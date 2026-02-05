/**
 * Migration Script: Remove features from Organization settings
 * Run: node scripts/remove_features_from_orgs.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrateOrganizations = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get the organizations collection directly
        const db = mongoose.connection.db;
        const orgsCollection = db.collection('organizations');

        // Find all organizations that have the features field
        const orgsWithFeatures = await orgsCollection.find({ 'settings.features': { $exists: true } }).toArray();
        console.log(`📦 Found ${orgsWithFeatures.length} organizations with features field`);

        if (orgsWithFeatures.length === 0) {
            console.log('✅ No organizations need migration');
            process.exit(0);
        }

        // Remove features field from all organizations
        const result = await orgsCollection.updateMany(
            { 'settings.features': { $exists: true } },
            { $unset: { 'settings.features': '' } }
        );

        console.log('\n========================================');
        console.log(`✅ Migration complete!`);
        console.log(`   Modified: ${result.modifiedCount} organizations`);
        console.log('   Removed: settings.features field');
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run the migration
migrateOrganizations();
