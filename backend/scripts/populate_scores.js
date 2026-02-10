const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Score = require('../models/Score');

// Using the Org ID from the user's example, or fall back to finding one if needed.
// Example provided: 6981a5c41f075f9b3c564ca3
// But if that ID doesn't exist in my local DB, I should probably find a real org first.
// I'll try to find the first organization if the specific one isn't found, or just query users directly.

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const populateScores = async () => {
    await connectDB();

    try {
        // Find existing users. Ideally for the specific org, but let's grab all users for now
        // to make sure we populate data broadly. Or filter by org if we want to be specific.
        // User example org_id: 6981a5c41f075f9b3c564ca3

        // Let's first check if we have users with that org_id
        const targetOrgId = '6981a5c41f075f9b3c564ca3';
        let users = await User.find({ org_id: targetOrgId });

        if (users.length === 0) {
            console.log(`No users found for org ${targetOrgId}. Fetching ANY users...`);
            users = await User.find({});
        }

        console.log(`Found ${users.length} users to check for scores.`);

        let createdCount = 0;
        let updatedCount = 0;

        for (const user of users) {
            // Check if score exists
            let score = await Score.findOne({ user_id: user._id });

            const randomPoints = Math.floor(Math.random() * 500) + 50; // Between 50 and 550

            if (!score) {
                // Create new score document based on user input structure
                score = new Score({
                    user_id: user._id,
                    org_id: user.org_id,
                    user_name_snapshot: user.name,
                    user_email_snapshot: user.email,
                    // Use random score to make leaderboard look real, or 150 as per example?
                    // "make sure the leaderboard data will consist" -> I'll assume they want valid data.
                    // Random is better for a leaderboard demo.
                    current_score: randomPoints,
                    history: [
                        {
                            source: "MOCK_IMPORT",
                            description: "Initial Import",
                            points: randomPoints
                        }
                    ]
                });
                await score.save();
                createdCount++;
                console.log(`Created score for ${user.name}: ${randomPoints}`);
            } else {
                // Should we update it? User said "add the data", implying new data or filling missing.
                // I'll only update if it has 0 points? Or maybe refresh snapshots?
                // Let's update snapshots at least.
                if (score.current_score === 0) {
                    score.current_score = randomPoints;
                    score.history.push({
                        source: "MOCK_UPDATE",
                        description: "Populating initial points",
                        points: randomPoints
                    });
                    updatedCount++;
                    console.log(`Updated score for ${user.name}: ${randomPoints}`);
                }
                score.user_name_snapshot = user.name;
                score.user_email_snapshot = user.email;
                await score.save();
            }
        }

        console.log('-----------------------------------');
        console.log(`Script Complete.`);
        console.log(`Created: ${createdCount}`);
        console.log(`Updated (Points): ${updatedCount}`);
        console.log('-----------------------------------');

    } catch (err) {
        console.error('Error populating scores:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

populateScores();
