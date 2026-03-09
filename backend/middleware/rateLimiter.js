const rateLimit = require('express-rate-limit');

// General API Rate Limiter
// Limits each IP to 100 requests per 1 minute window.
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 1 minute)
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after a minute'
    }
});

module.exports = {
    apiLimiter
};
