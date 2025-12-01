const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock Database (in production, use real DB)
const db = {
  users: new Map(),
  tasks: new Map(),
  offers: new Map(),
  chatThreads: new Map(),
  chatMessages: new Map(),
};

// Helper: Generate ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Helper: Get user from request (simplified auth)
const getAuthUser = (req) => {
  const userId = req.headers['x-user-id'];
  if (!userId) throw new Error('Not authenticated');
  return db.users.get(userId) || { id: userId };
};

// ⸻ 1. STRIPE CONNECT ONBOARDING ⸻
app.post('/api/stripe/connect/onboard', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const userId = user.id;

    if (!user.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
      });
      user.stripeAccountId = account.id;
      db.users.set(userId, user);
    }

    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/payouts/onboarding/refresh`,
      return_url: `${process.env.FRONTEND_URL}/payouts/onboarding/complete`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 2. CREATE TASK (with $7 minimum) ⸻
app.post('/api/tasks', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { title, description, category, zipCode, areaDescription, fullAddress, price, photosRequired } = req.body;

    const MIN_PRICE = parseFloat(process.env.MIN_JOB_PRICE_USD || '7');
    if (price < MIN_PRICE) {
      return res.status(400).json({ error: `Minimum job price is $${MIN_PRICE.toFixed(2)}` });
    }

    const task = {
      id: generateId(),
      title,
      description,
      category,
      zipCode,
      areaDescription: areaDescription || null,
      fullAddress: fullAddress || null,
      price,
      status: 'requested',
      posterId: user.id,
      posterName: user.name || 'Anonymous',
      posterEmail: user.email,
      helperId: null,
      helperName: null,
      confirmationCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      photosRequired: photosRequired || false,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeChargeId: null,
      platformFeeAmount: null,
      helperAmount: null,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      acceptedAt: null,
      completedAt: null,
      canceledAt: null,
      canceledBy: null,
    };

    db.tasks.set(task.id, task);
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 3. SEND OFFER ⸻
app.post('/api/tasks/:taskId/offers', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { taskId } = req.params;
    const { note, proposedPrice } = req.body;

    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'requested') {
      return res.status(400).json({ error: 'Task is not accepting offers' });
    }

    const offer = {
      id: generateId(),
      taskId,
      helperId: user.id,
      helperName: user.name || 'Anonymous',
      note,
      proposedPrice: proposedPrice || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.offers.set(offer.id, offer);
    res.json(offer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 4. CHOOSE HELPER → CREATE STRIPE CHECKOUT ⸻
app.post('/api/tasks/:taskId/choose-helper', async (req, res) => {
  try {
    const user = getAuthUser(req);
    const { taskId } = req.params;
    const { helperId } = req.body;

    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.posterId !== user.id) {
      return res.status(403).json({ error: 'Only poster can choose helper' });
    }
    if (task.status !== 'requested') {
      return res.status(400).json({ error: 'Task is not in requested status' });
    }

    const helper = db.users.get(helperId);
    if (!helper || !helper.stripeAccountId) {
      return res.status(400).json({ error: 'Helper does not have Stripe account set up' });
    }

    // Calculate amounts
    const amount = Math.round(task.price * 100); // cents
    const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15');
    const applicationFeeAmount = Math.round((platformFeePercent / 100) * amount);
    const helperAmount = amount - applicationFeeAmount;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: helper.stripeAccountId,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: task.title,
              description: task.description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      customer_email: task.posterEmail,
      metadata: {
        taskId: task.id,
        posterId: task.posterId,
        helperId,
      },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?task_id=${taskId}`,
    });

    // Update task with Stripe info (but not status yet)
    task.stripeCheckoutSessionId = session.id;
    task.platformFeeAmount = applicationFeeAmount;
    task.helperAmount = helperAmount;
    db.tasks.set(taskId, task);

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 5. STRIPE WEBHOOK ⸻
app.post('/api/stripe/webhook', async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
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

    const task = db.tasks.get(taskId);
    if (task) {
      const paymentIntentId = session.payment_intent;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const chargeId = paymentIntent.charges.data[0]?.id;

      task.status = 'accepted';
      task.helperId = helperId;
      task.helperName = (db.users.get(helperId)?.name) || 'Helper';
      task.acceptedAt = new Date().toISOString();
      task.stripePaymentIntentId = paymentIntentId;
      task.stripeChargeId = chargeId;
      task.paymentStatus = 'paid';

      db.tasks.set(taskId, task);

      // Decline other offers
      db.offers.forEach((offer) => {
        if (offer.taskId === taskId && offer.helperId !== helperId) {
          offer.status = 'declined';
        }
      });

      // Create chat thread
      const chatThread = {
        id: generateId(),
        taskId,
        posterId: task.posterId,
        helperId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isClosed: false,
      };
      db.chatThreads.set(chatThread.id, chatThread);
      db.chatMessages.set(chatThread.id, []);

      console.log(`✓ Job ${taskId} accepted, payment confirmed, chat created`);
    }
  }

  res.json({ received: true });
});

// ⸻ 6. CHAT MESSAGES ⸻
app.post('/api/chat/threads/:threadId/messages', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { threadId } = req.params;
    const { text, imageUrl, isProof } = req.body;

    const thread = db.chatThreads.get(threadId);
    if (!thread) return res.status(404).json({ error: 'Thread not found' });

    if (user.id !== thread.posterId && user.id !== thread.helperId) {
      return res.status(403).json({ error: 'Not authorized for this thread' });
    }

    const message = {
      id: generateId(),
      threadId,
      senderId: user.id,
      senderName: user.name || 'User',
      text: text || null,
      imageUrl: imageUrl || null,
      isProof: isProof || false,
      createdAt: new Date().toISOString(),
    };

    if (!db.chatMessages.has(threadId)) {
      db.chatMessages.set(threadId, []);
    }
    db.chatMessages.get(threadId).push(message);

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 7. COMPLETE TASK ⸻
app.post('/api/tasks/:taskId/complete', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { taskId } = req.params;

    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (user.id !== task.posterId && user.id !== task.helperId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (task.status !== 'accepted' && task.status !== 'in_progress') {
      return res.status(400).json({ error: 'Task cannot be completed at this status' });
    }

    // Check for proof if required
    if (task.photosRequired) {
      const chatThread = Array.from(db.chatThreads.values()).find(
        (t) => t.taskId === taskId
      );
      if (!chatThread) return res.status(400).json({ error: 'No chat thread found' });

      const messages = db.chatMessages.get(chatThread.id) || [];
      const hasProof = messages.some((m) => m.isProof && m.imageUrl);
      if (!hasProof) {
        return res.status(400).json({ error: 'Proof photo required to complete' });
      }
    }

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    db.tasks.set(taskId, task);

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 8. CANCEL TASK ⸻
app.post('/api/tasks/:taskId/cancel', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { taskId } = req.params;
    const { canceledBy } = req.body;

    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (canceledBy === 'poster' && task.posterId !== user.id) {
      return res.status(403).json({ error: 'Not poster' });
    }
    if (canceledBy === 'helper' && task.helperId !== user.id) {
      return res.status(403).json({ error: 'Not helper' });
    }

    if (task.status !== 'requested' && task.status !== 'accepted') {
      return res.status(400).json({ error: 'Cannot cancel at this status' });
    }

    task.status = 'canceled';
    task.canceledAt = new Date().toISOString();
    task.canceledBy = canceledBy;
    db.tasks.set(taskId, task);

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ 9. DISPUTE TASK ⸻
app.post('/api/tasks/:taskId/dispute', (req, res) => {
  try {
    const user = getAuthUser(req);
    const { taskId } = req.params;

    const task = db.tasks.get(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed tasks can be disputed' });
    }

    task.status = 'disputed';
    db.tasks.set(taskId, task);

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ⸻ HELPER: Save user on login ⸻
app.post('/api/users', (req, res) => {
  try {
    const { id, email, name, phone, defaultZipCode } = req.body;
    const user = { id, email, name, phone, defaultZipCode, createdAt: new Date().toISOString() };
    db.users.set(id, user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ⸻ HEALTH CHECK ⸻
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Stripe Connect initialized`);
  console.log(`✓ Minimum job price: $${process.env.MIN_JOB_PRICE_USD || '7'}`);
  console.log(`✓ Platform fee: ${process.env.PLATFORM_FEE_PERCENT || '15'}%`);
});

module.exports = app;
