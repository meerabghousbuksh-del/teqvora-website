const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
    {
        path: { type: String, required: true, maxlength: 200 },
        sessionId: { type: String, required: true, maxlength: 64 },
        referrerHost: { type: String, default: '', maxlength: 253 },
        // UTC calendar day (YYYY-MM-DD), stored so daily counts need no date maths in queries
        day: { type: String, required: true, index: true }
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

visitSchema.index({ day: 1, path: 1 });

module.exports = mongoose.model('Visit', visitSchema);
