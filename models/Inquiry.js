const mongoose = require('mongoose');
const { INQUIRY_TYPES, INQUIRY_STATUSES, EMAIL_STATUSES } = require('../utils/constants');

const inquirySchema = new mongoose.Schema(
    {
        type: { type: String, enum: INQUIRY_TYPES, default: 'contact', index: true },
        name: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        service: { type: String, required: true, trim: true, maxlength: 120 },
        subject: { type: String, trim: true, maxlength: 150, default: '' },
        message: { type: String, trim: true, maxlength: 5000, default: '' },
        consent: { type: Boolean, default: false },
        page: { type: String, trim: true, maxlength: 200, default: '' },
        status: { type: String, enum: INQUIRY_STATUSES, default: 'new', index: true },
        emailStatus: { type: String, enum: EMAIL_STATUSES, default: 'skipped' }
    },
    { timestamps: true }
);

inquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inquiry', inquirySchema);
