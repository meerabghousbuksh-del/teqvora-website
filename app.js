const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config/env');
const { isDatabaseReady } = require('./config/db');
const inquiryRoutes = require('./routes/inquiryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundApi, errorHandler } = require('./middleware/errorHandler');

const PUBLIC_DIR = path.join(__dirname, 'public');

function createApp() {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', config.trustProxy);

    // The pages load libraries from CDNs and use inline scripts, so a strict
    // Content-Security-Policy is left off; the other helmet protections stay on.
    app.use(helmet({ contentSecurityPolicy: false }));

    // CORS is only needed when the frontend is hosted on a different origin.
    if (config.clientOrigins.length > 0) {
        app.use('/api', cors({
            origin: config.clientOrigins,
            methods: ['GET', 'POST', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }

    app.use(express.json({ limit: '20kb' }));
    app.use(express.urlencoded({ extended: false, limit: '20kb' }));

    app.get('/api/health', (req, res) => {
        const database = isDatabaseReady() ? 'connected' : 'disconnected';
        res.status(database === 'connected' ? 200 : 503).json({ status: database === 'connected' ? 'ok' : 'degraded', database });
    });

    app.use('/api/contact', inquiryRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', notFoundApi);

    app.use(express.static(PUBLIC_DIR));
    app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'teqvora.HTML')));
    app.get('/admin', (req, res) => res.redirect('/admin/'));

    app.use(errorHandler);
    return app;
}

module.exports = createApp;
