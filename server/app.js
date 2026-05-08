const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// 1. HELMET (Security Headers)
// Set contentSecurityPolicy to false so CDNs (Tailwind/FontAwesome) are not blocked
app.use(helmet({ contentSecurityPolicy: false }));

// 2. RATE LIMITING (Prevent Brute Force)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter); // Apply to all API routes

// 3. CORS & JSON Parsers
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb to prevent DDoS
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// 4. MONGO SANITIZE (Prevent NoSQL Injection)
app.use((req, res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});

// 5. Static Folders
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

module.exports = app;