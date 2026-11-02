const Inquiry = require('../models/Inquiry');
const mailer = require('../utils/mailer');
const { validateInquiry } = require('../utils/validation');

const SUCCESS_MESSAGES = {
    contact: 'Thanks! Your message has been received and we will reply soon.',
    'strategy-audit': 'Your free strategy call request has been received. We will contact you to confirm a time.'
};

// POST /api/contact  (contact form and Strategy Audit modal)
async function createInquiry(req, res) {
    const { isValid, errors, value } = validateInquiry(req.body);
    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: 'Please correct the highlighted fields.',
            errors
        });
    }

    const inquiry = await Inquiry.create(value);

    // The enquiry is already saved at this point. A mail problem must not turn
    // it into an error for the visitor, but it is recorded for the dashboard.
    const { status: emailStatus } = await mailer.sendInquiryNotification(inquiry);
    if (emailStatus !== inquiry.emailStatus) {
        inquiry.emailStatus = emailStatus;
        await inquiry.save();
    }

    return res.status(201).json({
        success: true,
        message: SUCCESS_MESSAGES[inquiry.type],
        id: inquiry.id
    });
}

module.exports = { createInquiry };
