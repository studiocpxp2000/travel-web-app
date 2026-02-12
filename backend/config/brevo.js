// Brevo Service Wrapper (@getbrevo/brevo v3)
const Brevo = require('@getbrevo/brevo');

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'no-reply@travelapp.com';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Travel App';

/**
 * Check if Brevo is properly configured
 */
const isBrevoConfigured = () => {
    return process.env.BREVO_API_KEY && process.env.BREVO_API_KEY !== 'your_brevo_api_key';
};

/**
 * Create a configured TransactionalEmailsApi instance
 */
const getApiInstance = () => {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    return apiInstance;
};

/**
 * Send a single transactional email via Brevo
 */
const sendSingleEmail = async ({ to, subject, htmlContent, cc, bcc, senderName, senderEmail }) => {
    if (!isBrevoConfigured()) {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return { success: true, mock: true };
    }

    const apiInstance = getApiInstance();

    const sendSmtpEmail = {
        subject,
        htmlContent,
        sender: {
            name: senderName || SENDER_NAME,
            email: senderEmail || SENDER_EMAIL
        },
        to: [{ email: to }]
    };

    if (cc && cc.length > 0) {
        sendSmtpEmail.cc = cc.map(email => ({ email }));
    }
    if (bcc && bcc.length > 0) {
        sendSmtpEmail.bcc = bcc.map(email => ({ email }));
    }

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return { success: true, messageId: data.body?.messageId || data.messageId };
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error.body || error.message);
        return { success: false, error: error.body?.message || error.message };
    }
};

/**
 * Send bulk emails in batches for scalability (1000+ recipients)
 * 
 * Brevo rate limits:
 * - Free plan: 300 emails/day
 * - Starter: up to 100k emails/month
 * - Transactional API: ~10 requests/second recommended
 * 
 * Strategy: Send in batches of 50 with a short delay between batches
 * to avoid rate limiting. Each recipient gets their own individual email.
 */
const sendBulkEmails = async ({ recipients, subject, htmlContent, cc, bcc, onProgress }) => {
    const BATCH_SIZE = 50;
    const DELAY_BETWEEN_BATCHES_MS = 1000; // 1 second between batches
    const results = [];

    const batches = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    console.log(`[EMAIL] Starting bulk send: ${recipients.length} recipients in ${batches.length} batches of ${BATCH_SIZE}`);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
        const batch = batches[batchIdx];

        // Send all emails in this batch concurrently
        const batchPromises = batch.map(recipientEmail =>
            sendSingleEmail({
                to: recipientEmail,
                subject,
                htmlContent,
                cc: batchIdx === 0 ? cc : [], // CC/BCC only on first batch to avoid spam
                bcc: batchIdx === 0 ? bcc : [],
            }).then(result => ({
                email: recipientEmail,
                ...result
            }))
        );

        const batchResults = await Promise.allSettled(batchPromises);

        for (const result of batchResults) {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({
                    email: 'unknown',
                    success: false,
                    error: result.reason?.message || 'Promise rejected'
                });
            }
        }

        // Report progress
        const completedCount = results.length;
        console.log(`[EMAIL] Batch ${batchIdx + 1}/${batches.length} complete. ${completedCount}/${recipients.length} sent.`);

        if (onProgress) {
            onProgress(completedCount, recipients.length);
        }

        // Delay between batches (skip on last batch)
        if (batchIdx < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
        }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[EMAIL] Bulk send complete: ${successful} succeeded, ${failed} failed out of ${recipients.length}`);

    return {
        results,
        summary: {
            total: recipients.length,
            successful,
            failed
        }
    };
};

module.exports = { sendEmail: sendSingleEmail, sendSingleEmail, sendBulkEmails, isBrevoConfigured };
