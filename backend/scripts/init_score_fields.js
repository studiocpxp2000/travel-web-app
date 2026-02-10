const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Score = require('../models/Score');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const initScoreFields = async () => {
    await connectDB();

    try {
        console.log('Initializing redeemed_codes field for all scores...');

        const result = await Score.updateMany(
            { redeemed_codes: { $exists: false } },
            { $set: { redeemed_codes: [] } }
        );

        console.log('-----------------------------------');
        console.log(`Initialization Complete.`);
        console.log(`Matched (Missing Field): ${result.matchedCount}`);
        console.log(`Modified (Updated): ${result.modifiedCount}`);
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Error initializing scores:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

initScoreFields();
