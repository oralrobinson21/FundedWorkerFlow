const { Resend } = require('resend');

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not configured - email sending disabled');
      return null;
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const DEFAULT_FROM = 'CityTasks <onboarding@resend.dev>';

/**
 * Send a test email
 */
async function sendTestEmail(to = 'delivered@resend.dev') {
  const resend = getResendClient();
  if (!resend) throw new Error('Email service not configured');
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: '✅ CityTasks Test Email',
    html: '<strong>This is a test email sent from CityTasks via Resend.</strong>',
  });
}

/**
 * Send OTP verification code
 */
async function sendOTPEmail(to, code) {
  const resend = getResendClient();
  if (!resend) throw new Error('Email service not configured');
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject: 'Your CityTasks Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00B87C;">CityTasks Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="background: #f4f4f4; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px;">
          ${code}
        </h1>
        <p>This code will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send contact form email
 */
async function sendContactEmail(fromEmail, message, contactEmail) {
  const resend = getResendClient();
  if (!resend) throw new Error('Email service not configured');
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: contactEmail,
    replyTo: fromEmail,
    subject: `New Contact Form Message from ${fromEmail}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00B87C;">New Contact Form Submission</h2>
        <p><strong>From:</strong> ${fromEmail}</p>
        <hr style="border: 1px solid #eee;" />
        <div style="padding: 20px; background: #f9f9f9; border-left: 4px solid #00B87C;">
          ${message}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Reply directly to this email to respond to ${fromEmail}
        </p>
      </div>
    `,
  });
}

/**
 * Generic email sending function
 */
async function sendEmail({ to, subject, html, text, replyTo }) {
  const resend = getResendClient();
  if (!resend) throw new Error('Email service not configured');
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
  });
}

module.exports = {
  sendTestEmail,
  sendOTPEmail,
  sendContactEmail,
  sendEmail,
};
