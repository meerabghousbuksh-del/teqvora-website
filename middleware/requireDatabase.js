const { isDatabaseReady } = require('../config/db');

// Routes that read or write MongoDB answer 503 while the connection is down,
// instead of failing with a confusing internal error.
module.exports = function requireDatabase(req, res, next) {
    if (isDatabaseReady()) return next();
    return res.status(503).json({
        success: false,
        message: 'The service is temporarily unavailable. Please try again shortly.'
    });
};
