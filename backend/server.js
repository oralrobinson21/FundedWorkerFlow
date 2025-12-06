const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sendTestEmail } = require('./lib/resend');

const app = express();
const PORT = process.env.BACKEND_PORT || 5001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Email Test
app.get('/api/test-email', async (req, res) => {
  try {
    const to = req.query.to || 'delivered@resend.dev';
    const result = await sendTestEmail(to);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Minimal backend running on http://localhost:${PORT}`);
});
