const config = require('../config/env');

function notFoundApi(req, res) {
    res.status(404).json({
        success: false,
        message: `No API route for ${req.method} ${req.originalUrl}`
    });
}

// Must be registered last. Every API failure leaves the server as JSON with
// { success: false, message } so the frontend can always show something useful.
function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);

    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'The request body is not valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'The request is too large.' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Some fields are invalid.' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid identifier.' });
    }

    console.error(`${req.method} ${req.originalUrl} failed:`, error);
    return res.status(500).json({
        success: false,
        message: config.isProduction ? 'Something went wrong on our side.' : error.message
    });
}

module.exports = { notFoundApi, errorHandler };
