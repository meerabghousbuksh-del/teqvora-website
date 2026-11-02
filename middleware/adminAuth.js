const config = require('../config/env');
const { verifyAdminToken } = require('../utils/adminToken');

module.exports = function adminAuth(req, res, next) {
    const header = req.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!verifyAdminToken(token, config.tokenSecret)) {
        return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }
    return next();
};
