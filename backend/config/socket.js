const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const UserLocation = require('../models/UserLocation');
const User = require('../models/User'); // Required to get org_id if not in token

let io;

const initSocket = (server) => {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://travelapp.thecloudplay.com',
        'https://api.travelapp.thecloudplay.com',
        process.env.CLIENT_URL
    ].filter(Boolean);

    io = socketIO(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true
        },
        // Scalability tuning for 1000+ concurrent users
        pingTimeout: 30000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6, // 1MB max message size
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes recovery window
            skipMiddlewares: true,
        },
    });

    // JWT Authentication Middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                // If no token, we still allow connection for public/unauthenticated events (like join_org)
                return next();
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            console.error('Socket authentication error:', err.message);
            // Don't reject completely, just don't set socket.user so they can't send auth-required events
            next(); 
        }
    });

    io.on('connection', (socket) => {
        // Handle User Connected (Location Tracking)
        socket.on('userConnected', async (data) => {
            if (!socket.user || !socket.user.id) return;
            
            try {
                const userId = socket.user.id;
                // Determine org_id, if not in token, fetch from user model
                let orgId = socket.user.org_id;
                if (!orgId) {
                    const user = await User.findById(userId).select('org_id');
                    if (user) orgId = user.org_id;
                }

                if (orgId) {
                    await UserLocation.findOneAndUpdate(
                        { user_id: userId },
                        { 
                            user_id: userId,
                            org_id: orgId,
                            isOnline: true,
                            socketId: socket.id,
                            lastUpdated: new Date()
                        },
                        { upsert: true, new: true }
                    );
                    
                    io.to(`admin_${orgId}`).emit("userOnline", { userId });
                }
            } catch (error) {
                console.error('Error in userConnected:', error);
            }
        });

        // Handle Location Update
        socket.on('locationUpdate', async (data) => {
            if (!socket.user || !socket.user.id) return;
            const { latitude, longitude, timestamp } = data;
            const userId = socket.user.id;

            try {
                const userLoc = await UserLocation.findOneAndUpdate(
                    { user_id: userId },
                    { 
                        location: {
                            type: 'Point',
                            coordinates: [longitude, latitude] // Note: GeoJSON is [lng, lat]
                        },
                        lastUpdated: new Date(timestamp || Date.now())
                    },
                    { new: true }
                );

                if (userLoc) {
                    // Broadcast to org specific admins room
                    io.to(`admin_${userLoc.org_id}`).emit("userLocationUpdated", {
                        userId: userId,
                        latitude,
                        longitude,
                        timestamp,
                        org_id: userLoc.org_id
                    });
                }
            } catch (error) {
                console.error('Error in locationUpdate:', error);
            }
        });

        // Handle Socket Disconnect
        socket.on('disconnect', async () => {
            try {
                // Find the user location record to get the org_id and user_id
                const userLocPre = await UserLocation.findOne({ socketId: socket.id });
                if (!userLocPre) return;

                // Give mobile devices a 15-second grace period. 
                // They often switch to HTTP background polling when the app is minimized (which suspends the websocket).
                setTimeout(async () => {
                    // Check if the user has updated their location via HTTP within the last 20 seconds
                    const currentLoc = await UserLocation.findOne({ user_id: userLocPre.user_id });
                    
                    if (currentLoc) {
                        const timeSinceLastUpdate = Date.now() - new Date(currentLoc.lastUpdated).getTime();
                        
                        // If they haven't sent any update (socket or HTTP) for >20 seconds, mark them offline
                        if (timeSinceLastUpdate > 20000) {
                            currentLoc.isOnline = false;
                            await currentLoc.save();
                            io.to(`admin_${currentLoc.org_id}`).emit("userOffline", { userId: currentLoc.user_id });
                        }
                    }
                }, 15000);

            } catch (error) {
                console.error('Error on socket disconnect:', error);
            }
        });

        // Join Organization Room (Public & Admin)
        socket.on('join_org', (orgSlug) => {
            if (!orgSlug) return;
            socket.join(orgSlug);
        });

        // Join Admin Specific Room (for sensitive updates)
        socket.on('join_admin_room', (orgSlug) => {
            if (!orgSlug) return;
            const room = `admin_${orgSlug}`;
            socket.join(room);
        });

        // Join User Private Room (for helpdesk responses)
        socket.on('join_user_room', (userId) => {
            if (!userId) return;
            const room = `user_${userId}`;
            socket.join(room);
        });
    });

    // Global sweeping interval for Zombie connections
    // If a device dies, is uninstalled, or loses connection silently, this ensures they go offline
    setInterval(async () => {
        try {
            const staleThreshold = new Date(Date.now() - 30000); // 30 seconds ago
            const staleUsers = await UserLocation.find({
                isOnline: true,
                lastUpdated: { $lt: staleThreshold }
            });

            for (const userLoc of staleUsers) {
                userLoc.isOnline = false;
                await userLoc.save();
                // We don't have socket instances here, so we broadcast via io.to
                io.to(`admin_${userLoc.org_id}`).emit("userOffline", { userId: userLoc.user_id });
            }
        } catch (error) {
            console.error('Error sweeping stale users:', error);
        }
    }, 15000); // Check every 15 seconds

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
