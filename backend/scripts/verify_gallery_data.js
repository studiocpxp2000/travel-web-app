const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const GalleryItem = require('../models/GalleryItem');
const Organization = require('../models/Organization');

const verifyGallery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Get all organizations
        const orgs = await Organization.find({});
        console.log(`Found ${orgs.length} organizations.`);

        for (const org of orgs) {
            console.log(`\nChecking Org: ${org.name} (Slug: ${org.slug}, ID: ${org._id})`);

            // 2. Find gallery items for this org
            const items = await GalleryItem.find({ org_id: org._id });
            console.log(`Found ${items.length} gallery items.`);

            if (items.length > 0) {
                console.log('Sample Item:', JSON.stringify(items[0], null, 2));
            } else {
                // Check if there are ANY gallery items at all
                const allItems = await GalleryItem.find({});
                if (allItems.length > 0 && allItems[0].org_id) {
                    console.log(`Mismatch check: First global item has org_id ${allItems[0].org_id}. Does it match? ${allItems[0].org_id.toString() === org._id.toString()}`);
                }
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyGallery();
