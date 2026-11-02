const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInquiry, validateVisit } = require('../utils/validation');

const validContact = {
    type: 'contact',
    name: 'Ayesha Khan',
    email: 'Ayesha@Example.com ',
    service: 'Shopify Development',
    subject: 'New store',
    message: 'We would like help launching a Shopify store.',
    consent: true
};

test('accepts a complete contact enquiry and normalises the email', () => {
    const { isValid, value } = validateInquiry(validContact);
    assert.equal(isValid, true);
    assert.equal(value.email, 'ayesha@example.com');
    assert.equal(value.type, 'contact');
});

test('treats the checkbox value "on" as consent', () => {
    const { isValid } = validateInquiry({ ...validContact, consent: 'on' });
    assert.equal(isValid, true);
});

test('rejects a contact enquiry without consent, message or valid email', () => {
    const { isValid, errors } = validateInquiry({ ...validContact, consent: false, message: 'short', email: 'nope' });
    assert.equal(isValid, false);
    assert.ok(errors.consent);
    assert.ok(errors.message);
    assert.ok(errors.email);
});

test('strategy audit needs only name, email and service', () => {
    const { isValid, value } = validateInquiry({
        type: 'strategy-audit',
        name: 'Omar Sheikh',
        email: 'omar@company.com',
        service: 'Amazon PPC'
    });
    assert.equal(isValid, true);
    assert.equal(value.subject, 'Strategy audit request');
    assert.equal(value.consent, false);
});

test('unknown enquiry types fall back to contact', () => {
    const { value } = validateInquiry({ ...validContact, type: 'admin' });
    assert.equal(value.type, 'contact');
});

test('single-line fields cannot carry line breaks (email header injection)', () => {
    const { value } = validateInquiry({ ...validContact, subject: 'Hello\r\nBcc: attacker@example.com' });
    assert.equal(value.subject.includes('\n'), false);
    assert.equal(value.subject.includes('\r'), false);
});

test('rejects over-long fields', () => {
    const { isValid, errors } = validateInquiry({ ...validContact, name: 'x'.repeat(101), message: 'y'.repeat(5001) });
    assert.equal(isValid, false);
    assert.ok(errors.name);
    assert.ok(errors.message);
});

test('handles missing or non-object bodies without throwing', () => {
    assert.equal(validateInquiry(undefined).isValid, false);
    assert.equal(validateInquiry('text').isValid, false);
    assert.equal(validateInquiry({ name: { $gt: '' } }).isValid, false);
});

test('visit: accepts a path and strips the query string', () => {
    const { isValid, value } = validateVisit({
        path: '/service.html?utm=x#top',
        sessionId: 'abc12345-session',
        referrer: 'https://www.google.com/search?q=teqvora'
    });
    assert.equal(isValid, true);
    assert.equal(value.path, '/service.html');
    assert.equal(value.referrerHost, 'www.google.com');
});

test('visit: rejects a missing path or malformed session id', () => {
    assert.equal(validateVisit({ path: 'service.html', sessionId: 'abc12345' }).isValid, false);
    assert.equal(validateVisit({ path: '/', sessionId: 'bad id!' }).isValid, false);
    assert.equal(validateVisit(null).isValid, false);
});

test('visit: ignores an unparsable referrer', () => {
    const { value } = validateVisit({ path: '/', sessionId: 'abc12345', referrer: 'not a url' });
    assert.equal(value.referrerHost, '');
});
