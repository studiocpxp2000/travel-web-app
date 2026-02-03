// Brevo Service Wrapper
const Brevo = require('brevo');

// We'll use the API key from env
const defaultClient = Brevo.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Initialize only if API key is present
if (process.env.BREVO_API_KEY) {
    apiKey.apiKey = process.env.BREVO_API_KEY;
} else {
    console.warn("BREVO_API_KEY is missing. Email service will not function.");
}

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendEmail = async ({ to, subject, htmlContent, senderName = "Travel App" }) => {
    if (!process.env.BREVO_API_KEY) {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return { success: true, mock: true };
    }

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { "name": senderName, "email": "no-reply@travelapp.com" }; // Configurable sender
    sendSmtpEmail.to = [{ "email": to }];

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully. ID:', data.messageId);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
};

module.exports = { sendEmail };
