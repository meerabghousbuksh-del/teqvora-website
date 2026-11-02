const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const adminAuth = require('../middleware/adminAuth');
const requireDatabase = require('../middleware/requireDatabase');
const { createRateLimiter } = require('../middleware/rateLimit');
const controller = require('../controllers/adminController');

const router = express.Router();

const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many sign-in attempts. Please wait 15 minutes and try again.'
});

router.post('/login', loginLimiter, asyncHandler(controller.login));

// Everything below needs a valid admin token and a working database.
router.use(adminAuth, requireDatabase);

router.get('/stats', asyncHandler(controller.getStats));
router.get('/inquiries', asyncHandler(controller.listInquiries));
router.patch('/inquiries/:id', asyncHandler(controller.updateInquiryStatus));
router.delete('/inquiries/:id', asyncHandler(controller.deleteInquiry));

module.exports = router;
