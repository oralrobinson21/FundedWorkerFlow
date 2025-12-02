const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { pool, initDatabase } = require('./db');
const { getStripeClient, getStripeSync, getStripePublishableKey } = require('./stripeClient');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Helper: Generate ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: Get user from request (simplified auth)
const getAuthUser = async (req) => {
  const userId = req.headers['x-user-id'];
  if (!userId) throw new Error('Not authenticated');
  
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0] || { id: userId };
};

// Helper: Log activity
const logActivity = async (eventType, userId, taskId, offerId, details) => {
  try {
    await pool.query(`
      INSERT INTO activity_logs (event_type, user_id, task_id, offer_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `, [eventType, userId, taskId, offerId, JSON.stringify(details)]);
    console.log(`[LOG] ${eventType}:`, { userId, taskId, offerId, ...details });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// ⸻ STRIPE WEBHOOK (must be BEFORE express.json) ⸻
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = await getStripeClient();
    const sig = req.headers['stripe-signature'];
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Webhook signature failed:', error);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const taskId = session.metadata.taskId;
      const helperId = session.metadata.helperId;

      const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
      const task = taskResult.rows[0];
      
      if (task) {
        const paymentIntentId = session.payment_intent;
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const chargeId = paymentIntent.latest_charge;

        const helperResult = await pool.query('SELECT * FROM users WHERE id = $1', [helperId]);
        const helper = helperResult.rows[0];

        await pool.query(`
          UPDATE tasks SET 
            status = 'accepted',
            helper_id = $1,
            helper_name = $2,
            accepted_at = NOW(),
            stripe_payment_intent_id = $3,
            stripe_charge_id = $4,
            payment_status = 'paid'
          WHERE id = $5
        `, [helperId, helper?.name || 'Helper', paymentIntentId, chargeId, taskId]);

        // Decline other offers
        await pool.query(`
          UPDATE offers SET status = 'declined'
          WHERE task_id = $1 AND helper_id != $2
        `, [taskId, helperId]);

        // Create chat thread
        const chatThreadId = generateId();
        await pool.query(`
          INSERT INTO chat_threads (id, task_id, poster_id, helper_id, expires_at)
          VALUES ($1, $2, $3, $4, NOW() + INTERVAL '3 days')
        `, [chatThreadId, taskId, task.poster_id, helperId]);

        console.log(`Job ${taskId} accepted, payment confirmed, chat created`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware (AFTER webhook route)
app.use(cors());
app.use(express.json());

// ⸻ AUTH: SEND OTP ⸻
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await pool.query(`
      INSERT INTO otp_codes (email, code, expires_at)
      VALUES ($1, $2, $3)
    `, [email.toLowerCase(), code, expiresAt]);

    // In dev mode, log the code
    console.log(`[DEV] OTP Code for ${email}: ${code}`);

    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ AUTH: VERIFY OTP ⸻
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    // Check OTP
    const otpResult = await pool.query(`
      SELECT * FROM otp_codes 
      WHERE email = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE
      ORDER BY created_at DESC LIMIT 1
    `, [email.toLowerCase(), code]);

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark OTP as used
    await pool.query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [otpResult.rows[0].id]);

    // Find or create user
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user = userResult.rows[0];

    if (!user) {
      const userId = generateId();
      await pool.query(`
        INSERT INTO users (id, email)
        VALUES ($1, $2)
      `, [userId, email.toLowerCase()]);
      user = { id: userId, email: email.toLowerCase() };
    }

    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        defaultZipCode: user.default_zip_code,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ UPDATE USER PROFILE ⸻
app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, defaultZipCode } = req.body;

    await pool.query(`
      UPDATE users SET name = $1, phone = $2, default_zip_code = $3
      WHERE id = $4
    `, [name, phone, defaultZipCode, userId]);

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      defaultZipCode: user.default_zip_code,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 1. STRIPE CONNECT ONBOARDING ⸻
app.post('/api/stripe/connect/onboard', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const stripe = await getStripeClient();

    let stripeAccountId = user.stripe_account_id;
    
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });
      stripeAccountId = account.id;
      await pool.query('UPDATE users SET stripe_account_id = $1 WHERE id = $2', [stripeAccountId, user.id]);
    }

    const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${frontendUrl}/payouts/onboarding/refresh`,
      return_url: `${frontendUrl}/payouts/onboarding/complete`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ CHECK STRIPE ACCOUNT STATUS ⸻
app.get('/api/stripe/connect/status', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    
    if (!user.stripe_account_id) {
      return res.json({ hasAccount: false, isOnboarded: false });
    }

    const stripe = await getStripeClient();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);

    res.json({
      hasAccount: true,
      isOnboarded: account.details_submitted && account.charges_enabled,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 2. CREATE TASK (with $7 minimum) ⸻
app.post('/api/tasks', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { title, description, category, zipCode, areaDescription, fullAddress, price, photosRequired, toolsRequired, toolsProvided, taskPhotoUrl } = req.body;

    const MIN_PRICE = parseFloat(process.env.MIN_JOB_PRICE_USD || '7');
    if (price < MIN_PRICE) {
      return res.status(400).json({ error: `Minimum job price is $${MIN_PRICE.toFixed(2)}` });
    }

    const taskId = generateId();
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await pool.query(`
      INSERT INTO tasks (id, title, description, category, zip_code, area_description, full_address, 
        price, poster_id, poster_name, poster_email, poster_photo_url, confirmation_code, photos_required, tools_required, tools_provided, task_photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [taskId, title, description, category, zipCode, areaDescription, fullAddress, 
        price, user.id, user.name || 'Anonymous', user.email, user.profile_photo_url, confirmationCode, 
        photosRequired || false, toolsRequired || false, toolsProvided || false, taskPhotoUrl]);

    await logActivity('task_created', user.id, taskId, null, { title, category, price });

    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET TASKS (for helpers to discover) ⸻
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, zipCode, category, toolsRequired, toolsProvided } = req.query;
    
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (zipCode) {
      query += ` AND zip_code = $${paramIndex++}`;
      params.push(zipCode);
    }
    if (category && category !== 'All') {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (toolsRequired === 'true') {
      query += ` AND tools_required = TRUE`;
    } else if (toolsRequired === 'false') {
      query += ` AND tools_required = FALSE`;
    }
    if (toolsProvided === 'true') {
      query += ` AND tools_provided = TRUE`;
    } else if (toolsProvided === 'false') {
      query += ` AND tools_provided = FALSE`;
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET MY TASKS (poster's tasks) ⸻
app.get('/api/my-tasks', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const result = await pool.query('SELECT * FROM tasks WHERE poster_id = $1 ORDER BY created_at DESC', [user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET MY JOBS (helper's accepted jobs) ⸻
app.get('/api/my-jobs', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const result = await pool.query('SELECT * FROM tasks WHERE helper_id = $1 ORDER BY created_at DESC', [user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET TASK BY ID ⸻
app.get('/api/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 3. SEND OFFER ⸻
app.post('/api/tasks/:taskId/offers', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { taskId } = req.params;
    const { note, proposedPrice } = req.body;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'requested') {
      return res.status(400).json({ error: 'Task is not accepting offers' });
    }

    const offerId = generateId();
    await pool.query(`
      INSERT INTO offers (id, task_id, helper_id, helper_name, helper_photo_url, note, proposed_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [offerId, taskId, user.id, user.name || 'Anonymous', user.profile_photo_url, note, proposedPrice]);

    await logActivity('offer_submitted', user.id, taskId, offerId, { note, proposedPrice });

    const result = await pool.query('SELECT * FROM offers WHERE id = $1', [offerId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET OFFERS FOR TASK ⸻
app.get('/api/tasks/:taskId/offers', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query('SELECT * FROM offers WHERE task_id = $1 ORDER BY created_at DESC', [taskId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 4. CHOOSE HELPER → CREATE STRIPE CHECKOUT ⸻
app.post('/api/tasks/:taskId/choose-helper', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { taskId } = req.params;
    const { helperId } = req.body;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.poster_id !== user.id) {
      return res.status(403).json({ error: 'Only poster can choose helper' });
    }
    if (task.status !== 'requested') {
      return res.status(400).json({ error: 'Task is not in requested status' });
    }

    const helperResult = await pool.query('SELECT * FROM users WHERE id = $1', [helperId]);
    const helper = helperResult.rows[0];
    
    if (!helper || !helper.stripe_account_id) {
      return res.status(400).json({ error: 'Helper does not have Stripe account set up' });
    }

    const stripe = await getStripeClient();
    
    // Calculate amounts
    const amount = Math.round(task.price * 100); // cents
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15');
    const applicationFeeAmount = Math.round((platformFeePercent / 100) * amount);
    const helperAmount = amount - applicationFeeAmount;

    const frontendUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: helper.stripe_account_id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: task.title,
              description: task.description || 'Task payment',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: task.poster_email,
      metadata: {
        taskId: task.id,
        posterId: task.poster_id,
        helperId,
      },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancel?task_id=${taskId}`,
    });

    // Update task with Stripe info
    await pool.query(`
      UPDATE tasks SET 
        stripe_checkout_session_id = $1,
        platform_fee_amount = $2,
        helper_amount = $3
      WHERE id = $4
    `, [session.id, applicationFeeAmount, helperAmount, taskId]);

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 6. CHAT MESSAGES ⸻
app.get('/api/chat/threads', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const result = await pool.query(`
      SELECT ct.*, t.title as task_title, t.status as task_status
      FROM chat_threads ct
      JOIN tasks t ON ct.task_id = t.id
      WHERE ct.poster_id = $1 OR ct.helper_id = $1
      ORDER BY ct.created_at DESC
    `, [user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat/threads/:threadId/messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const result = await pool.query('SELECT * FROM chat_messages WHERE thread_id = $1 ORDER BY created_at ASC', [threadId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/threads/:threadId/messages', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { threadId } = req.params;
    const { text, imageUrl, isProof } = req.body;

    const threadResult = await pool.query('SELECT * FROM chat_threads WHERE id = $1', [threadId]);
    const thread = threadResult.rows[0];
    
    if (!thread) return res.status(404).json({ error: 'Thread not found' });
    if (user.id !== thread.poster_id && user.id !== thread.helper_id) {
      return res.status(403).json({ error: 'Not authorized for this thread' });
    }

    const messageId = generateId();
    await pool.query(`
      INSERT INTO chat_messages (id, thread_id, sender_id, sender_name, text, image_url, is_proof)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [messageId, threadId, user.id, user.name || 'User', text, imageUrl, isProof || false]);

    const result = await pool.query('SELECT * FROM chat_messages WHERE id = $1', [messageId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 7. COMPLETE TASK ⸻
app.post('/api/tasks/:taskId/complete', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { taskId } = req.params;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (user.id !== task.poster_id && user.id !== task.helper_id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (task.status !== 'accepted' && task.status !== 'in_progress') {
      return res.status(400).json({ error: 'Task cannot be completed at this status' });
    }

    // Check for proof if required
    if (task.photos_required) {
      const threadResult = await pool.query('SELECT id FROM chat_threads WHERE task_id = $1', [taskId]);
      if (threadResult.rows.length === 0) {
        return res.status(400).json({ error: 'No chat thread found' });
      }

      const messagesResult = await pool.query(
        'SELECT * FROM chat_messages WHERE thread_id = $1 AND is_proof = TRUE AND image_url IS NOT NULL',
        [threadResult.rows[0].id]
      );
      if (messagesResult.rows.length === 0) {
        return res.status(400).json({ error: 'Proof photo required to complete' });
      }
    }

    await pool.query('UPDATE tasks SET status = $1, completed_at = NOW() WHERE id = $2', ['completed', taskId]);
    
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 8. CANCEL TASK ⸻
app.post('/api/tasks/:taskId/cancel', async (req, res) => {
  try {
    const user = await getAuthUser(req);
    const { taskId } = req.params;
    const { canceledBy } = req.body;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (canceledBy === 'poster' && task.poster_id !== user.id) {
      return res.status(403).json({ error: 'Not poster' });
    }
    if (canceledBy === 'helper' && task.helper_id !== user.id) {
      return res.status(403).json({ error: 'Not helper' });
    }
    if (task.status !== 'requested' && task.status !== 'accepted') {
      return res.status(400).json({ error: 'Cannot cancel at this status' });
    }

    await pool.query(`
      UPDATE tasks SET status = 'canceled', canceled_at = NOW(), canceled_by = $1
      WHERE id = $2
    `, [canceledBy, taskId]);

    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 9. DISPUTE TASK ⸻
app.post('/api/tasks/:taskId/dispute', async (req, res) => {
  try {
    const { taskId } = req.params;

    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    const task = taskResult.rows[0];
    
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed tasks can be disputed' });
    }

    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', ['disputed', taskId]);
    
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ PROFILE PHOTO ⸻
app.put('/api/users/:userId/photo', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profilePhotoUrl } = req.body;

    await pool.query('UPDATE users SET profile_photo_url = $1 WHERE id = $2', [profilePhotoUrl, userId]);

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      defaultZipCode: user.default_zip_code,
      profilePhotoUrl: user.profile_photo_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ CHECK PROFILE PHOTO ⸻
app.get('/api/users/:userId/has-photo', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT profile_photo_url FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ hasPhoto: false });
    }
    
    const hasPhoto = !!result.rows[0].profile_photo_url;
    res.json({ hasPhoto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ GET ACTIVITY LOGS ⸻
app.get('/api/activity-logs', async (req, res) => {
  try {
    const { taskId, userId, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (taskId) {
      query += ` AND task_id = $${paramIndex++}`;
      params.push(taskId);
    }
    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ STRIPE PUBLISHABLE KEY ⸻
app.get('/api/stripe/config', async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ HEALTH CHECK ⸻
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize and start server
async function start() {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on http://0.0.0.0:${PORT}`);
      console.log(`Minimum job price: $${process.env.MIN_JOB_PRICE_USD || '7'}`);
      console.log(`Platform fee: ${process.env.PLATFORM_FEE_PERCENT || '15'}%`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;
