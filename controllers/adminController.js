const mongoose = require('mongoose');
const config = require('../config/env');
const Inquiry = require('../models/Inquiry');
const { INQUIRY_STATUSES, INQUIRY_TYPES } = require('../utils/constants');
const { createAdminToken, passwordMatches } = require('../utils/adminToken');
const { getVisitSummary } = require('./analyticsController');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toInquiryResponse(inquiry) {
    return {
        id: inquiry.id,
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        service: inquiry.service,
        subject: inquiry.subject,
        message: inquiry.message,
        status: inquiry.status,
        emailStatus: inquiry.emailStatus,
        page: inquiry.page,
        createdAt: inquiry.createdAt
    };
}

// POST /api/admin/login
async function login(req, res) {
    const password = req.body && typeof req.body.password === 'string' ? req.body.password : '';

    if (!password || !passwordMatches(password, config.adminPassword)) {
        return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = createAdminToken(config.tokenSecret, config.tokenTtlMs);
    return res.json({ success: true, token, expiresInMs: config.tokenTtlMs });
}

// GET /api/admin/stats
async function getStats(req, res) {
    const [statusGroups, strategyAudits, visits] = await Promise.all([
        Inquiry.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Inquiry.countDocuments({ type: 'strategy-audit' }),
        getVisitSummary()
    ]);

    const byStatus = Object.fromEntries(INQUIRY_STATUSES.map((status) => [status, 0]));
    statusGroups.forEach((group) => { byStatus[group._id] = group.count; });
    const totalInquiries = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    return res.json({
        success: true,
        inquiries: { total: totalInquiries, byStatus, strategyAudits },
        visits
    });
}

// GET /api/admin/inquiries?status=&type=&q=&page=&limit=
async function listInquiries(req, res) {
    const { status, type, q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

    const filter = {};
    if (INQUIRY_STATUSES.includes(status)) filter.status = status;
    if (INQUIRY_TYPES.includes(type)) filter.type = type;
    if (typeof q === 'string' && q.trim()) {
        const pattern = new RegExp(escapeRegex(q.trim().slice(0, 100)), 'i');
        filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }, { service: pattern }];
    }

    const [items, total] = await Promise.all([
        Inquiry.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        Inquiry.countDocuments(filter)
    ]);

    return res.json({
        success: true,
        items: items.map(toInquiryResponse),
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        total
    });
}

// PATCH /api/admin/inquiries/:id   body: { status }
async function updateInquiryStatus(req, res) {
    const { id } = req.params;
    const status = req.body && req.body.status;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid enquiry id.' });
    }
    if (!INQUIRY_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Status must be one of: ${INQUIRY_STATUSES.join(', ')}.`
        });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
    if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }
    return res.json({ success: true, inquiry: toInquiryResponse(inquiry) });
}

// DELETE /api/admin/inquiries/:id
async function deleteInquiry(req, res) {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid enquiry id.' });
    }

    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }
    return res.json({ success: true });
}

module.exports = { login, getStats, listInquiries, updateInquiryStatus, deleteInquiry };
