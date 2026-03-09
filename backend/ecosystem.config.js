module.exports = {
    apps: [
        {
            name: 'travel-app-backend',
            script: 'server.js',
            instances: 'max', // Or a specific number like 2 for a small VPS
            exec_mode: 'cluster', // Enables zero-downtime reloads
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
