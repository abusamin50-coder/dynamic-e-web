const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * PROTECT MIDDLEWARE
 * Checks if user is logged in AND if their account is ACTIVE.
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Get token from header
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Get user from the token (excluding password)
            req.user = await User.findById(decoded.id).select('-password');

            // --- NEW LOGIC START ---
            // 4. Check if user account is suspended or blocked
            if (req.user && req.user.status !== 'active') {
                res.status(403); // Forbidden
                throw new Error(`Your account is ${req.user.status}. Please contact the administrator.`);
            }
            // --- NEW LOGIC END ---

            next();
        } catch (error) {
            console.error("Auth Error:", error.message);
            res.status(401);
            next(error); // Pass error to global error handler
        }
    }

    if (!token) {
        res.status(401);
        const error = new Error('Not authorized, no token provided');
        next(error);
    }
};

/**
 * ADMIN MIDDLEWARE
 * Ensures only users with the 'admin' role can access specific routes.
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        const error = new Error('Access denied: Admins only');
        next(error);
    }
};

module.exports = { protect, admin };