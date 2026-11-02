const crypto = require('crypto');

// Small signed-token helpers for the single admin login. The token is
// "<base64url payload>.<base64url HMAC-SHA256 signature>" and carries only
// an expiry time, so no extra library is needed.

function signPayload(encodedPayload, secret) {
    return crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

function createAdminToken(secret, ttlMs, now = Date.now()) {
    const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: now + ttlMs })).toString('base64url');
    return `${payload}.${signPayload(payload, secret)}`;
}

// Returns the payload when the token is genuine and unexpired, otherwise null.
function verifyAdminToken(token, secret, now = Date.now()) {
    if (typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

    const [encodedPayload, signature] = parts;
    const expected = Buffer.from(signPayload(encodedPayload, secret));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
        return payload.role === 'admin' && payload.exp > now ? payload : null;
    } catch (error) {
        return null;
    }
}

// Compares hashes so the comparison time does not depend on password length.
function passwordMatches(candidate, expected) {
    const hash = (value) => crypto.createHash('sha256').update(String(value)).digest();
    return crypto.timingSafeEqual(hash(candidate), hash(expected));
}

module.exports = { createAdminToken, verifyAdminToken, passwordMatches };
