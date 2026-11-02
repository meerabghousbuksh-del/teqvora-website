const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const createApp = require('./app');

const SHUTDOWN_TIMEOUT_MS = 10000;

async function start() {
    await connectDatabase(config.mongodbUri);

    const app = createApp();
    const server = app.listen(config.port, () => {
        console.log(`TEQVORA is running at http://localhost:${config.port}`);
        console.log(`Admin dashboard: http://localhost:${config.port}/admin/`);
        if (!require('./utils/mailer').isConfigured) {
            console.log('Email notifications are off (SMTP_HOST / NOTIFY_EMAIL not set). Enquiries are still saved.');
        }
    });

    async function shutdown(signal) {
        console.log(`${signal} received, shutting down.`);
        const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
        forceExit.unref();

        server.close(async () => {
            await disconnectDatabase();
            process.exit(0);
        });
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
    console.error(`Could not start the server: ${error.message}`);
    process.exit(1);
});
