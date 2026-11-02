const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireDatabase = require('../middleware/requireDatabase');
const { createRateLimiter } = require('../middleware/rateLimit');
const { createInquiry } = require('../controllers/inquiryController');

const router = express.Router();

const inquiryLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 8,
    message: 'Too many messages sent from this connection. Please try again in a few minutes.'
});

router.post('/', inquiryLimiter, requireDatabase, asyncHandler(createInquiry));

module.exports = router;
