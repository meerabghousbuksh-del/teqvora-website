const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdminToken, verifyAdminToken, passwordMatches } = require('../utils/adminToken');

const SECRET = 'a-test-secret-that-is-at-least-32-characters';
const HOUR = 60 * 60 * 1000;

test('a fresh token verifies', () => {
    const token = createAdminToken(SECRET, HOUR);
    assert.equal(verifyAdminToken(token, SECRET).role, 'admin');
});

test('an expired token is rejected', () => {
    const token = createAdminToken(SECRET, HOUR, 1000);
    assert.equal(verifyAdminToken(token, SECRET, 1000 + HOUR + 1), null);
});

test('a token signed with another secret is rejected', () => {
    const token = createAdminToken('another-secret-another-secret-another', HOUR);
    assert.equal(verifyAdminToken(token, SECRET), null);
});

test('a tampered payload is rejected', () => {
    const [, signature] = createAdminToken(SECRET, HOUR).split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 999 * HOUR })).toString('base64url');
    assert.equal(verifyAdminToken(`${forgedPayload}.${signature}`, SECRET), null);
});

test('malformed tokens are rejected without throwing', () => {
    ['', 'abc', 'a.b.c', '.', undefined, null, 42].forEach((token) => {
        assert.equal(verifyAdminToken(token, SECRET), null);
    });
});

test('password comparison', () => {
    assert.equal(passwordMatches('correct horse', 'correct horse'), true);
    assert.equal(passwordMatches('wrong', 'correct horse'), false);
    assert.equal(passwordMatches('', 'correct horse'), false);
});
