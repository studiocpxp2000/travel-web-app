const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Only try to connect if MONGO_URI is set to a valid string, otherwise skip (for dev without DB)
        if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('your_connection_string')) {
            console.log('MongoDB URI not defined or is placeholder. Skipping DB connection.');
            return;
        }

        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 200,       // Handle 1000+ concurrent connections (default: 100)
            minPoolSize: 10,        // Keep warm connections ready
            serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is unreachable
            socketTimeoutMS: 45000, // Prevent stale connections
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Do not exit process in dev, just log error
        // process.exit(1); 
    }
};

module.exports = connectDB;
