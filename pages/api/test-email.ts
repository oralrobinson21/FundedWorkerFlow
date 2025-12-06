// pages/api/test-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendTestEmail } from '../../lib/resend';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await sendTestEmail();
    res.status(200).json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
