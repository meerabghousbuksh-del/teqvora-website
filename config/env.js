require('dotenv').config();

const REQUIRED_VARIABLES = ['MONGODB_URI', 'ADMIN_PASSWORD', 'ADMIN_TOKEN_SECRET'];
const MIN_SECRET_LENGTH = 32;

function readList(value) {
    return (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function loadConfig() {
    const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
    if (missing.length > 0) {
        throw new Error(
            `Missing environment variables: ${missing.join(', ')}. ` +
            'Copy .env.example to .env and fill them in.'
        );
    }

    if (process.env.ADMIN_TOKEN_SECRET.length < MIN_SECRET_LENGTH) {
        throw new Error(`ADMIN_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`);
    }

    const smtpHost = process.env.SMTP_HOST || '';
    const notifyEmail = process.env.NOTIFY_EMAIL || '';

    return {
        port: Number(process.env.PORT) || 3000,
        isProduction: process.env.NODE_ENV === 'production',
        mongodbUri: process.env.MONGODB_URI,
        adminPassword: process.env.ADMIN_PASSWORD,
        tokenSecret: process.env.ADMIN_TOKEN_SECRET,
        tokenTtlMs: 8 * 60 * 60 * 1000,
        clientOrigins: readList(process.env.CLIENT_ORIGIN),
        trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
        smtp: {
            isConfigured: Boolean(smtpHost && notifyEmail),
            host: smtpHost,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
            from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost',
            notifyEmail
        }
    };
}

let config;
try {
    config = loadConfig();
} catch (error) {
    console.error(`Configuration error: ${error.message}`);
    process.exit(1);
}

module.exports = config;
