const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Score = require('../models/Score'); // Uses updated schema with redeemed_codes

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const migrateRedeemedCodes = async () => {
    await connectDB();

    try {
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        const scoresCollection = db.collection('scores'); // Can use model too, but let's be consistent or use model for Score

        // Find users who have redeemed_codes (non-empty array)
        // Note: Field might not exist on some users
        const usersWithCodes = await usersCollection.find({
            redeemed_codes: { $exists: true, $not: { $size: 0 } }
        }).toArray();

        console.log(`Found ${usersWithCodes.length} users with redeemed codes to migrate.`);

        let migratedCount = 0;
        let missingScoreCount = 0;

        for (const user of usersWithCodes) {
            const codes = user.redeemed_codes;

            if (!codes || codes.length === 0) continue;

            const score = await Score.findOne({ user_id: user._id });

            if (score) {
                // Add codes to Score, ensuring uniqueness
                // Using Mongoose document method or updateOne
                await Score.updateOne(
                    { _id: score._id },
                    { $addToSet: { redeemed_codes: { $each: codes } } }
                );

                // Remove from User
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $unset: { redeemed_codes: "" } }
                );

                migratedCount++;
                console.log(`Migrated ${codes.length} codes for user ${user.name} (${user.email || 'no-email'})`);
            } else {
                console.warn(`No score found for user ${user.name} (${user._id}). Skipping migration.`);
                missingScoreCount++;
            }
        }

        // Also cleanup empty arrays from users just to be clean?
        // User asked to "exchange the field", effectively moving data. 
        // Removing the field entirely is consistent with schema update.
        // Let's remove the field from ALL users who have it, even if empty, to match schema.
        await usersCollection.updateMany(
            { redeemed_codes: { $exists: true } },
            { $unset: { redeemed_codes: "" } }
        );
        console.log('Cleaned up redeemed_codes field from all users.');


        console.log('-----------------------------------');
        console.log(`Migration Complete.`);
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped (No Score): ${missingScoreCount}`);
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

migrateRedeemedCodes();
