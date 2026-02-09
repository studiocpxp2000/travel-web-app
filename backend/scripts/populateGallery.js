const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const GalleryItem = require('../models/GalleryItem');
const Organization = require('../models/Organization');
const User = require('../models/User');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.AWS_BUCKET_NAME;

const TRAVEL_IMAGES = [
    { name: 'mountain-trek.jpg', url: 'https://picsum.photos/id/10/1200/800' },
    { name: 'beach-sunset.jpg', url: 'https://picsum.photos/id/13/1200/800' },
    { name: 'forest-path.jpg', url: 'https://picsum.photos/id/16/1200/800' },
    { name: 'city-lights.jpg', url: 'https://picsum.photos/id/29/1200/800' }
];

async function populate() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/travel-web-app');
        console.log('Connected to DB');

        const org = await Organization.findOne({ slug: 'travel-adventures' });
        if (!org) throw new Error('Org not found');

        let admin = await User.findOne({ org_id: org._id, role: 'admin_org' });
        if (!admin) {
            console.log('No specific org_admin found, using first available user for this org');
            admin = await User.findOne({ org_id: org._id });
        }

        if (!admin) throw new Error('No users found for this org');

        for (const imgData of TRAVEL_IMAGES) {
            console.log(`Processing ${imgData.name}...`);
            const response = await fetch(imgData.url);
            const buffer = await response.arrayBuffer();

            const filename = `${Date.now()}-${imgData.name}`;
            const key = `travel-adventures/gallery/${filename}`;

            const uploadCommand = new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: Buffer.from(buffer),
                ContentType: 'image/jpeg'
            });

            await s3.send(uploadCommand);
            const s3Url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
            console.log(`Uploaded to S3: ${s3Url}`);

            await GalleryItem.create({
                org_id: org._id,
                url: s3Url,
                type: 'image',
                uploadedBy: admin._id
            });
            console.log(`Created DB entry for ${imgData.name}`);
        }

        console.log('Population complete!');
        process.exit(0);
    } catch (err) {
        console.error('Population FAILED:', err);
        process.exit(1);
    }
}

populate();
