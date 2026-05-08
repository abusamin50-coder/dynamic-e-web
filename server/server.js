const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');

// Load environment variables
dotenv.config();

// Connect to Database (MongoDB Atlas or Local)
connectDB();

// Dynamic Port Configuration
// If 5000 is busy, it will check the .env, or use 5005 as a backup
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`-----------------------------------------------`);
});

// Handle unhandled promise rejections (e.g. DB connection issues)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle Port Errors directly
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        console.log(`💡 Tip: Change the PORT in your .env file to 5001 or kill the process.`);
        process.exit(1);
    }
});