const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireDatabase = require('../middleware/requireDatabase');
const { createRateLimiter } = require('../middleware/rateLimit');
const { recordVisit } = require('../controllers/analyticsController');

const router = express.Router();

const visitLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    message: 'Too many requests.'
});

router.post('/visit', visitLimiter, requireDatabase, asyncHandler(recordVisit));

// Anything else on /visit gets an explicit, accurate 405 instead of a generic 404.
router.all('/visit', (req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({ success: false, message: 'Use POST for /api/analytics/visit.' });
});

module.exports = router;
