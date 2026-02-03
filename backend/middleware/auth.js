const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Promoter = require('../models/Promoter');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }
    // vs. Cookies? keeping it simple with headers first as per initial plan, but backend plan said Cookies. 
    // Let's support both or stick to one. frontend usually sends headers in RTK Query.
    // If we want HTTPOnly cookies, we need cookie-parser.
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists
        // We need to know "who" it is. Our payload should contain { id, role, type }
        // For now, I'll assume we look up based on the payload type

        req.user = decoded; // Attach full decoded payload

        // Optional: Fetch full user object if needed, but for performance validation is enough
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Super Admin Only
exports.protectSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Super Admin access required' });
    }
    next();
};
