const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * PROTECT MIDDLEWARE
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                return next(new Error('User not found'));
            }

            // Check if user account is suspended or blocked
            if (req.user.status !== 'active') {
                res.status(403);
                return next(new Error(`Your account is ${req.user.status}. Please contact the administrator.`));
            }

            return next();
        } catch (error) {
            console.error("Auth Error:", error.message);
            res.status(401);
            return next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token provided'));
    }
};

/**
 * ADMIN MIDDLEWARE
 */
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    } else {
        res.status(403);
        return next(new Error('Access denied: Admins only'));
    }
};

module.exports = { protect, admin };