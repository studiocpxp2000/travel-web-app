const NodeCache = require('node-cache');

// Initialize the global cache.
// stdTTL: Standard Time To Live in seconds. 60 seconds is perfect for high-read APIs.
// checkperiod: How often to delete expired keys from memory.
const globalCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

module.exports = globalCache;
