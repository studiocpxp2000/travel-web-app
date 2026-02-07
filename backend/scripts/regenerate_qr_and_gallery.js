/**
 * Script: Regenerate QR codes for all users using their email
 * Also seeds GalleryItems with sample images
 * Run: node scripts/regenerate_qr_and_gallery.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const GalleryItem = require('../models/GalleryItem');
const { generateAndUploadQR } = require('../services/qrService');

// Sample working images from Unsplash
const sampleImages = [
    { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', caption: 'Mountain Adventure' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', caption: 'Beach Paradise' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', caption: 'Nature Escape' },
    { url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800', caption: 'Lake View' },
    { url: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800', caption: 'Travel Moments' },
    { url: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800', caption: 'City Lights' },
    { url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', caption: 'Sunset Colors' },
    { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', caption: 'Historic Temple' },
];

const regenerateQRAndSeedGallery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all organizations
        const organizations = await Organization.find();
        console.log(`📦 Found ${organizations.length} organizations`);

        let qrGenerated = 0;
        let qrFailed = 0;
        let galleryCreated = 0;

        for (const org of organizations) {
            console.log(`\n📂 Processing: ${org.name} (${org.slug})`);

            // ==================
            // 1. REGENERATE QR CODES
            // ==================

            // Clear all qr_code_url and qr_data for this org's users
            await User.updateMany(
                { org_id: org._id },
                { $unset: { qr_code_url: 1, qr_data: 1 } }
            );
            console.log(`   🗑️ Cleared QR data for users`);

            // Get all users for this org
            const users = await User.find({ org_id: org._id });
            console.log(`   👥 Found ${users.length} users`);

            for (const user of users) {
                try {
                    // Use email as QR data (identifier for scanning)
                    const qrData = user.email || `user-${user._id}`;

                    // Generate and upload QR
                    const qrUrl = await generateAndUploadQR(qrData, org.slug, user._id);
                    user.qr_code_url = qrUrl;
                    await user.save();
                    qrGenerated++;

                } catch (err) {
                    console.error(`   ❌ Failed for ${user.email}: ${err.message}`);
                    qrFailed++;
                }
            }
            console.log(`   ✅ Generated ${qrGenerated} QR codes`);

            // ==================
            // 2. SEED GALLERY ITEMS
            // ==================

            // Check if gallery already has items
            const existingGallery = await GalleryItem.countDocuments({ org_id: org._id });
            if (existingGallery > 0) {
                console.log(`   ⏭️ Gallery already has ${existingGallery} items`);
                continue;
            }

            // Create gallery items with sample images
            for (const img of sampleImages) {
                await GalleryItem.create({
                    org_id: org._id,
                    url: img.url,
                    caption: img.caption,
                    type: 'image'
                });
                galleryCreated++;
            }
            console.log(`   🖼️ Created ${sampleImages.length} gallery items`);
        }

        console.log('\n========================================');
        console.log('✅ Complete!');
        console.log(`   QR Generated: ${qrGenerated}`);
        console.log(`   QR Failed: ${qrFailed}`);
        console.log(`   Gallery Items Created: ${galleryCreated}`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }
};

regenerateQRAndSeedGallery();
