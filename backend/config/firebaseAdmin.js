const { initializeApp, cert } = require('firebase-admin/app');
const path = require('path');
const fs = require('fs');

let initialized = false;

const initFirebaseAdmin = () => {
    if (initialized) return;

    try {
        const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
        
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized successfully');
            initialized = true;
        } else {
            console.warn('Firebase Admin SDK NOT initialized: firebase-service-account.json not found in config/');
        }
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
    }
};

// Initialize immediately on import
initFirebaseAdmin();

module.exports = { initFirebaseAdmin };
