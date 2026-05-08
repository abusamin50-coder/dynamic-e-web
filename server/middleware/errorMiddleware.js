const errorHandler = (err, req, res, next) => {
    // If status code is 200, change it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    res.status(statusCode).json({
        success: false,
        message: err.message,
        // Hide technical stack trace in production mode
        stack: process.env.NODE_ENV === 'production' ? '🔒 Hidden' : err.stack,
    });
};

module.exports = { errorHandler };