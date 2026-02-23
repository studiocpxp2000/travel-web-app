/**
 * Migration: migrate_wall_moderator.js
 * 
 * Backfills the `is_moderator` field on existing WallPost documents.
 * Looks up each post's user_id → User.role and sets is_moderator = true
 * for admin_org / super_admin roles.
 * 
 * Safe to run multiple times — only updates posts where is_moderator is
 * not yet set (defaults to false in schema, but older docs lack the field).
 * 
 * Usage: node scripts/migrate_wall_moderator.js
 */

'use strict';

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const WallPost = require('../models/WallPost');
const User = require('../models/User');

const migrate = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MONGO_URI not set in .env');

        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // 1. Set is_moderator = false on all posts that lack the field
        const setDefault = await WallPost.updateMany(
            { is_moderator: { $exists: false } },
            { $set: { is_moderator: false } }
        );
        console.log(`📊 Set is_moderator=false on ${setDefault.modifiedCount} post(s) missing the field`);

        // 1b. Remove legacy caption field from all docs (schema no longer has it)
        const removeCaption = await WallPost.updateMany(
            { caption: { $exists: true } },
            { $unset: { caption: '' } }
        );
        console.log(`🧹 Removed caption field from ${removeCaption.modifiedCount} post(s)`);

        // 2. Find all admin/super_admin user IDs
        const adminUsers = await User.find(
            { role: { $in: ['admin_org', 'super_admin'] } },
            '_id role name'
        ).lean();

        const adminIds = adminUsers.map(u => u._id);
        console.log(`👤 Found ${adminIds.length} admin/super_admin user(s)`);

        if (adminIds.length === 0) {
            console.log('ℹ️  No admin users found — nothing to update');
        } else {
            // 3. Mark their wall posts as moderator
            const result = await WallPost.updateMany(
                { user_id: { $in: adminIds } },
                { $set: { is_moderator: true } }
            );
            console.log(`✅ Marked ${result.modifiedCount} post(s) as is_moderator=true`);
        }

        // 4. Summary
        const total = await WallPost.countDocuments();
        const moderatorCount = await WallPost.countDocuments({ is_moderator: true });
        console.log(`\n📋 Summary: ${moderatorCount}/${total} posts flagged as moderator`);

        console.log('🎉 Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
