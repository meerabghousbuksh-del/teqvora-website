const config = require('../config/env');

function buildNotification(inquiry) {
    const isStrategyAudit = inquiry.type === 'strategy-audit';
    const subject = isStrategyAudit
        ? `Strategy audit request: ${inquiry.service}`
        : `New enquiry: ${inquiry.subject || inquiry.service}`;

    const lines = [
        `Type: ${isStrategyAudit ? 'Strategy audit call' : 'Contact enquiry'}`,
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Service: ${inquiry.service}`
    ];
    if (inquiry.subject) lines.push(`Subject: ${inquiry.subject}`);
    if (inquiry.page) lines.push(`Sent from: ${inquiry.page}`);
    if (inquiry.message) lines.push('', 'Message:', inquiry.message);

    return { subject, text: lines.join('\n') };
}

function createMailer(smtp) {
    if (!smtp.isConfigured) {
        return { isConfigured: false, sendInquiryNotification: async () => ({ status: 'skipped' }) };
    }

    // Loaded only when email is configured, so the server runs without SMTP.
    const nodemailer = require('nodemailer');
    const transport = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined
    });

    return {
        isConfigured: true,
        async sendInquiryNotification(inquiry) {
            const { subject, text } = buildNotification(inquiry);
            try {
                await transport.sendMail({
                    from: smtp.from,
                    to: smtp.notifyEmail,
                    replyTo: inquiry.email,
                    subject,
                    text
                });
                return { status: 'sent' };
            } catch (error) {
                console.error('Could not send enquiry notification email:', error.message);
                return { status: 'failed' };
            }
        }
    };
}

module.exports = createMailer(config.smtp);
module.exports.buildNotification = buildNotification;
