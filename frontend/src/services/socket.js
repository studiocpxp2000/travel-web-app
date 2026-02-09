import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        const socketUrl = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:8080';
        socket = io(socketUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        console.log('Initializing new socket connection...');
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
        socket = null;
    }
};

export const joinOrg = (orgSlug) => {
    const s = getSocket();
    if (s && orgSlug) {
        s.emit('join_org', orgSlug);
    }
};

export const joinAdminRoom = (orgSlug) => {
    const s = getSocket();
    if (s && orgSlug) {
        s.emit('join_admin_room', orgSlug);
    }
};

export const joinUserRoom = (userId) => {
    const s = getSocket();
    if (s && userId) {
        s.emit('join_user_room', userId);
    }
};
