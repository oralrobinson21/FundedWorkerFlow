import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendTestEmail = async () => {
  try {
    const response = await resend.emails.send({
      from: 'oralrobinson21@outlook.com',
to: 'oralrobinson21@outlook.com',
      subject: '✅ Resend Test Email',
      html: '<strong>This is working 🎉</strong>',
    });

    console.log('Sent ✅', response);
    return response;
  } catch (error) {
    console.error('Failed ❌', error);
    throw error;
  }
};
