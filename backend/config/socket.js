const socketIO = require('socket.io');

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

    io.on('connection', (socket) => {
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

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIO };
