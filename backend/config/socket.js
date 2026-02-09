const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log(`Socket Connected: ${socket.id}`);

        // Join Organization Room (Public & Admin)
        socket.on('join_org', (orgSlug) => {
            if (!orgSlug) return;
            socket.join(orgSlug);
            console.log(`[Socket] ${socket.id} joined ${orgSlug}`);
        });

        // Join Admin Specific Room (for sensitive updates)
        socket.on('join_admin_room', (orgSlug) => {
            // In a real app, we should verify token here before allowing join
            if (!orgSlug) return;
            const room = `admin_${orgSlug}`;
            socket.join(room);
            console.log(`[Socket] ${socket.id} joined ADMIN room: ${room}`);
        });

        // Join User Private Room (for helpdesk responses)
        socket.on('join_user_room', (userId) => {
            if (!userId) return;
            const room = `user_${userId}`;
            socket.join(room);
            console.log(`[Socket] ${socket.id} joined USER room: ${room}`);
        });

        socket.on('disconnect', () => {
            console.log(`Socket Disconnected: ${socket.id}`);
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
