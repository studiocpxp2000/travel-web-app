/**
 * Migration: seed_wall_feature.js
 * 
 * Non-destructive, idempotent migration to add Social Wall feature flags
 * to all existing Organization documents.
 * 
 * Safe to run multiple times — uses $set with $exists: false guard.
 * 
 * Usage: node scripts/seed_wall_feature.js
 */

'use strict';

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Organization = require('../models/Organization');

const migrateWallFeatures = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI not set in .env');
        }

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Count all orgs before migration
        const totalOrgs = await Organization.countDocuments();
        console.log(`📊 Found ${totalOrgs} organization(s) to migrate`);

        // Add feature flags where they don't exist yet (idempotent)
        const result = await Organization.updateMany(
            { 'settings.features': { $exists: false } },
            {
                $set: {
                    'settings.features': {
                        wall_enabled: false,
                        wall_upload_enabled: false
                    }
                }
            }
        );

        console.log(`✅ Migrated ${result.modifiedCount} organization(s) — added wall feature flags`);

        // Verify: show current state
        const orgs = await Organization.find({}, 'name slug settings.features').lean();
        console.log('\n📋 Current Feature Flags:');
        orgs.forEach(org => {
            const f = org.settings?.features || {};
            console.log(`  • ${org.name} (${org.slug}): wall_enabled=${f.wall_enabled}, wall_upload_enabled=${f.wall_upload_enabled}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrateWallFeatures();
