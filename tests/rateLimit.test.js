const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../middleware/rateLimit');

function createResponse() {
    return {
        statusCode: 200,
        headers: {},
        body: null,
        set(name, value) { this.headers[name] = value; return this; },
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
    };
}

function hit(limiter, ip) {
    const res = createResponse();
    let passed = false;
    limiter({ ip }, res, () => { passed = true; });
    return { passed, res };
}

test('allows requests up to the limit, then answers 429 with Retry-After', () => {
    let clock = 0;
    const limiter = createRateLimiter({ windowMs: 60000, max: 2, message: 'Slow down.', now: () => clock });

    assert.equal(hit(limiter, '1.1.1.1').passed, true);
    assert.equal(hit(limiter, '1.1.1.1').passed, true);

    const blocked = hit(limiter, '1.1.1.1');
    assert.equal(blocked.passed, false);
    assert.equal(blocked.res.statusCode, 429);
    assert.equal(blocked.res.body.message, 'Slow down.');
    assert.equal(blocked.res.headers['Retry-After'], '60');
});

test('counts each IP separately', () => {
    const limiter = createRateLimiter({ windowMs: 60000, max: 1, message: 'x', now: () => 0 });
    assert.equal(hit(limiter, '1.1.1.1').passed, true);
    assert.equal(hit(limiter, '2.2.2.2').passed, true);
    assert.equal(hit(limiter, '1.1.1.1').passed, false);
});

test('allows requests again after the window passes', () => {
    let clock = 0;
    const limiter = createRateLimiter({ windowMs: 1000, max: 1, message: 'x', now: () => clock });
    assert.equal(hit(limiter, '1.1.1.1').passed, true);
    assert.equal(hit(limiter, '1.1.1.1').passed, false);
    clock = 1001;
    assert.equal(hit(limiter, '1.1.1.1').passed, true);
});
