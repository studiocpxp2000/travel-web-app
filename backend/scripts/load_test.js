const { io } = require('socket.io-client');
const fs = require('fs');

// Configuration
const TARGET_URL = 'https://api.travelapp.thecloudplay.com'; // Change to localhost:8081 for local testing
const TOTAL_CLIENTS = 1000;
const CLIENT_CREATION_DELAY = 40; // slowed down to 40ms to avoid triggering Nginx/Express rate limiters from a single IP
const TEST_ORG_SLUG = 'load-test-org';

let connectedCount = 0;
let connectionErrors = 0;
let messageReceivedCount = 0;
const clients = [];

console.log(`Starting load test against ${TARGET_URL} for ${TOTAL_CLIENTS} concurrent users...`);

async function createClients() {
    return new Promise((resolve) => {
        let created = 0;

        const interval = setInterval(() => {
            const socket = io(TARGET_URL, {
                transports: ['websocket'],
                reconnection: false,
                query: { loadTest: true }
            });

            socket.on('connect', () => {
                connectedCount++;
                socket.emit('join_org', TEST_ORG_SLUG);
            });

            socket.on('connect_error', (err) => {
                connectionErrors++;
            });

            // Listen for any broadcast event, e.g., a wall post
            socket.on('new_wall_post', (data) => {
                messageReceivedCount++;
            });

            clients.push(socket);
            created++;

            if (created % 100 === 0) {
                console.log(`Created ${created}/${TOTAL_CLIENTS} sockets... (Connected: ${connectedCount})`);
            }

            if (created === TOTAL_CLIENTS) {
                clearInterval(interval);
                resolve();
            }
        }, CLIENT_CREATION_DELAY);
    });
}

async function runTest() {
    const startTime = Date.now();
    await createClients();

    // Wait extra time for remaining connections to establish
    console.log('Finished initiating connections, waiting 5 seconds for pending sockets...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('\n--- CONNECTION REPORT ---');
    console.log(`Target: ${TARGET_URL}`);
    console.log(`Total Attempted: ${TOTAL_CLIENTS}`);
    console.log(`Successfully Connected: ${connectedCount}`);
    console.log(`Connection Errors: ${connectionErrors}`);
    console.log(`Time taken to establish: ${(Date.now() - startTime) / 1000} seconds`);

    if (connectedCount < TOTAL_CLIENTS) {
        console.log('\n⚠️ WARNING: Not all clients could connect. The server might be bottlenecking.');
    } else {
        console.log('\n✅ SUCCESS: Server easily accepted 1000 concurrent socket connections.');
    }

    console.log('\n--- PM2 CLUSTER MODE VULNERABILITY TEST ---');
    console.log('If the backend is running in PM2 "cluster" mode across multiple CPU cores,');
    console.log('socket broadcasts will FAIL to reach all users unless Redis is installed.');
    console.log('To test this manually:');
    console.log(`1. Keep this script running.`);
    console.log(`2. Trigger a simple API call on your backend that emits 'new_wall_post' to room '${TEST_ORG_SLUG}'.`);
    console.log(`If messageReceivedCount below doesn't equal ${connectedCount}, the PM2 cluster is fractured!`);

    setInterval(() => {
        if (messageReceivedCount > 0) {
            console.log(`[Status] Messages received across all clients: ${messageReceivedCount} / ${connectedCount}`);
        }
    }, 2000);

    // Provide a way to exit manually
    setTimeout(() => {
        console.log('\nClosing all connections and ending test.');
        clients.forEach(s => s.disconnect());
        process.exit(0);
    }, 60000); // the test stays open for 60 seconds to wait for emissions
}

runTest();
