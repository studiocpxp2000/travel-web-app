require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('./models/Organization');
const User = require('./models/User');
const WallPost = require('./models/WallPost');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
    seedWallPosts();
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function seedWallPosts() {
    try {
        const org = await Organization.findOne();
        if (!org) {
            console.error('No organization found. Please create an organization first.');
            process.exit(1);
        }

        const dummyImages = [
            'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1473625247510-8ceb1760943f?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=800&auto=format&fit=crop',
        ];

        const dummyPosts = dummyImages.map((imageUrl, index) => ({
            org_id: org._id,
            user_name_snapshot: `Dummy User ${index + 1}`,
            imageUrl: imageUrl,
            s3_key: `dummy/path/image_${index + 1}.jpg`,
            is_moderator: index % 3 === 0 // Make every 3rd post from a moderator
        }));

        const result = await WallPost.insertMany(dummyPosts);
        console.log(`Successfully inserted ${result.length} dummy wall posts for organization: ${org.name}`);

    } catch (err) {
        console.error('Error seeding wall posts:', err);
    } finally {
        mongoose.connection.close();
    }
}
