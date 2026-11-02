const { INQUIRY_TYPES } = require('./constants');

const LIMITS = {
    name: 100,
    email: 254,
    service: 120,
    subject: 150,
    message: 5000,
    page: 200,
    visitPath: 200,
    referrer: 300
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

// Control characters except tab and newline
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const LINE_BREAKS = /[\r\n]+/g;

function cleanSingleLine(value) {
    if (typeof value !== 'string') return '';
    return value.replace(CONTROL_CHARACTERS, '').replace(LINE_BREAKS, ' ').trim();
}

function cleanMultiLine(value) {
    if (typeof value !== 'string') return '';
    return value.replace(CONTROL_CHARACTERS, '').replace(/\r\n/g, '\n').trim();
}

function isConsentGiven(value) {
    return value === true || value === 'true' || value === 'on';
}

// Validates an enquiry from the contact form or the Strategy Audit modal.
// Returns the cleaned values plus a field -> message map of problems.
function validateInquiry(body) {
    const input = body && typeof body === 'object' ? body : {};
    const errors = {};

    const type = INQUIRY_TYPES.includes(input.type) ? input.type : 'contact';
    const isStrategyAudit = type === 'strategy-audit';

    const name = cleanSingleLine(input.name);
    const email = cleanSingleLine(input.email).toLowerCase();
    const service = cleanSingleLine(input.service);
    const subject = cleanSingleLine(input.subject) || (isStrategyAudit ? 'Strategy audit request' : '');
    const message = cleanMultiLine(input.message);
    const consent = isConsentGiven(input.consent);
    const page = cleanSingleLine(input.page).slice(0, LIMITS.page);

    if (name.length < 2) errors.name = 'Please enter your full name.';
    else if (name.length > LIMITS.name) errors.name = `Name must be ${LIMITS.name} characters or fewer.`;

    if (!email) errors.email = 'Please enter your email address.';
    else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) errors.email = 'Please enter a valid email address.';

    if (!service) errors.service = 'Please select a service.';
    else if (service.length > LIMITS.service) errors.service = 'Service name is too long.';

    if (subject.length > LIMITS.subject) errors.subject = `Subject must be ${LIMITS.subject} characters or fewer.`;

    if (!isStrategyAudit) {
        if (message.length < 10) errors.message = 'Please tell us a little more (at least 10 characters).';
        if (!consent) errors.consent = 'Please agree to be contacted about this enquiry.';
    }
    if (message.length > LIMITS.message) errors.message = `Message must be ${LIMITS.message} characters or fewer.`;

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        value: { type, name, email, service, subject, message, consent, page }
    };
}

function extractHostname(referrer) {
    if (typeof referrer !== 'string' || !referrer) return '';
    try {
        return new URL(referrer.slice(0, LIMITS.referrer)).hostname;
    } catch (error) {
        return '';
    }
}

// Validates the page-view payload sent by public/js/analytics.js
function validateVisit(body) {
    const input = body && typeof body === 'object' ? body : {};
    const errors = {};

    const rawPath = typeof input.path === 'string' ? input.path : '';
    const path = rawPath.split(/[?#]/)[0];
    if (!path.startsWith('/') || path.length > LIMITS.visitPath) errors.path = 'path must start with "/" and be 200 characters or fewer.';

    const sessionId = typeof input.sessionId === 'string' ? input.sessionId : '';
    if (!SESSION_ID_PATTERN.test(sessionId)) errors.sessionId = 'sessionId must be 8-64 letters, numbers, "-" or "_".';

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        value: { path, sessionId, referrerHost: extractHostname(input.referrer) }
    };
}

module.exports = { validateInquiry, validateVisit, LIMITS };
