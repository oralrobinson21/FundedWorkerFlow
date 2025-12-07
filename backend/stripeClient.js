const Stripe = require('stripe');

// Initialize Stripe with secret key from environment
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });
}

function getStripePublishableKey() {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY not found in environment variables');
  }

  return process.env.STRIPE_PUBLISHABLE_KEY;
}

function getStripeSecretKey() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not found in environment variables');
  }

  return process.env.STRIPE_SECRET_KEY;
}

module.exports = {
  getStripeClient,
  getStripePublishableKey,
  getStripeSecretKey,
};
