module.exports = {
    apps: [
        {
            name: 'travel-app-backend',
            script: 'server.js',
            instances: 1, // Single instance to prevent Socket.io room fragmentation
            exec_mode: 'fork', // Fork mode instead of cluster for WebSockets without Redis
            env: {
                NODE_ENV: 'production',
                PORT: 8081 // New port as requested
            },
            // Watch options are typically off in production, but we ensure they are explicitly disabled
            watch: false,
            max_memory_restart: '1G' // Restart if it uses too much memory
        }
    ]
};
