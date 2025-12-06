require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sendTestEmail } = require('./lib/resend');

const app = express();
app.use(cors());

const PORT = process.env.BACKEND_PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test-email', async (req, res) => {
  const to = req.query.to || 'delivered@resend.dev';
  try {
    const result = await sendTestEmail(to);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
