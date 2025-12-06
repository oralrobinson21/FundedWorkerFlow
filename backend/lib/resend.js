const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail(to = 'delivered@resend.dev') {
  return await resend.emails.send({
    from: 'CityTasks <onboarding@resend.dev>',
    to,
    subject: '✅ CityTasks Test Email',
    html: '<strong>This is a test email sent from CityTasks via Resend.</strong>',
  });
}

module.exports = { sendTestEmail };
