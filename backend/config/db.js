const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('your_connection_string')) {
        console.log('MongoDB URI not defined or is placeholder. Skipping DB connection.');
        return;
    }

    if (!cached.promise) {
        const opts = {
            maxPoolSize: 10,        // Lower pool size for serverless to avoid connection limits
            serverSelectionTimeoutMS: 10000, // Wait up to 10s for server selection
            socketTimeoutMS: 45000, // Close idle sockets
        };

        cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log(`MongoDB Connected: ${cached.conn.connection.host}`);
    } catch (e) {
        cached.promise = null;
        console.error(`Error: ${e.message}`);
        throw e;
    }

    return cached.conn;
};

module.exports = connectDB;
