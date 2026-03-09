module.exports = {
    apps: [
        {
            name: 'travel-app-frontend',
            script: 'npm',
            args: 'start', // Ensure you have a 'start' script in frontend/package.json that either serves the dist folder or runs the production server.
            // E.g., "start": "serve -s dist -p 5174"
            env: {
                NODE_ENV: 'production',
                PORT: 5174 // New port as requested
            },
            watch: false,
            max_memory_restart: '1G' // Restart if it uses too much memory
        }
    ]
};
