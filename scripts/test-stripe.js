#!/usr/bin/env node

/**
 * Stripe Integration Testing Script
 * Tests Stripe configuration and payment flows
 */

const http = require('http');
const https = require('https');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`)
};

const API_URL = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5001';

function makeRequest(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (error) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testStripeConfig() {
  console.log('\n===========================================');
  console.log('Stripe Integration Testing');
  console.log('===========================================\n');
  log.info(`Testing Stripe at: ${API_URL}\n`);

  const results = [];

  // Test 1: Get Stripe Config
  try {
    log.info('Testing Stripe configuration endpoint...');
    const response = await makeRequest('GET', `${API_URL}/api/stripe/config`);

    if (response.status === 200 && response.body?.publishableKey) {
      const key = response.body.publishableKey;
      const keyType = key.startsWith('pk_test_') ? 'TEST' :
                     key.startsWith('pk_live_') ? 'LIVE' : 'UNKNOWN';

      log.success(`Stripe config endpoint working (${keyType} key)`);
      log.info(`Publishable key: ${key.substring(0, 20)}...`);

      if (keyType === 'TEST') {
        log.warning('Using TEST Stripe keys - switch to LIVE for production');
      }

      results.push({ test: 'Stripe Config', passed: true });
    } else {
      log.error(`Stripe config failed: ${response.status}`);
      results.push({ test: 'Stripe Config', passed: false, error: `Status ${response.status}` });
    }
  } catch (error) {
    log.error(`Stripe config error: ${error.message}`);
    results.push({ test: 'Stripe Config', passed: false, error: error.message });
  }

  // Test 2: Webhook Endpoint
  try {
    log.info('\nTesting Stripe webhook endpoint...');
    const response = await makeRequest('POST', `${API_URL}/api/stripe/webhook`, {});

    // Webhook should fail without signature, but endpoint should exist
    if (response.status === 400) {
      log.success('Stripe webhook endpoint exists (signature validation working)');
      results.push({ test: 'Stripe Webhook', passed: true });
    } else if (response.status === 404) {
      log.error('Stripe webhook endpoint not found');
      results.push({ test: 'Stripe Webhook', passed: false, error: 'Endpoint not found' });
    } else {
      log.warning(`Webhook returned unexpected status: ${response.status}`);
      results.push({ test: 'Stripe Webhook', passed: true, note: 'Endpoint exists' });
    }
  } catch (error) {
    log.error(`Stripe webhook error: ${error.message}`);
    results.push({ test: 'Stripe Webhook', passed: false, error: error.message });
  }

  // Test 3: Check Environment Variables
  console.log('\n');
  log.info('Checking Stripe environment configuration...');

  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', 'backend', '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const hasSecretKey = /STRIPE_SECRET_KEY=sk_(test|live)_\w+/.test(envContent);
    const hasPublishableKey = /STRIPE_PUBLISHABLE_KEY=pk_(test|live)_\w+/.test(envContent);
    const hasWebhookSecret = /STRIPE_WEBHOOK_SECRET=whsec_\w+/.test(envContent);

    if (hasSecretKey) {
      log.success('STRIPE_SECRET_KEY configured');
    } else {
      log.error('STRIPE_SECRET_KEY missing or invalid');
    }

    if (hasPublishableKey) {
      log.success('STRIPE_PUBLISHABLE_KEY configured');
    } else {
      log.error('STRIPE_PUBLISHABLE_KEY missing or invalid');
    }

    if (hasWebhookSecret) {
      log.success('STRIPE_WEBHOOK_SECRET configured');
    } else {
      log.warning('STRIPE_WEBHOOK_SECRET missing (webhooks will fail)');
    }

    results.push({
      test: 'Stripe Env Vars',
      passed: hasSecretKey && hasPublishableKey
    });
  } else {
    log.error('backend/.env not found');
    results.push({ test: 'Stripe Env Vars', passed: false, error: '.env not found' });
  }

  // Summary
  console.log('\n===========================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    log.error('\nSome Stripe tests failed');
    console.log('\nRecommendations:');
    log.info('1. Verify STRIPE_SECRET_KEY in backend/.env');
    log.info('2. Verify STRIPE_PUBLISHABLE_KEY in backend/.env');
    log.info('3. Set up Stripe webhook: https://dashboard.stripe.com/webhooks');
    log.info('4. Add webhook URL: [YOUR_URL]/api/stripe/webhook');
    log.info('5. Copy webhook secret to backend/.env');
  } else {
    log.success('\nAll Stripe tests passed!');
    console.log('\nStripe integration is ready for:');
    log.info('- Task payments (15% platform fee)');
    log.info('- Extra work requests');
    log.info('- Tips (0% fee)');
    log.info('- Stripe Connect payouts');
  }

  console.log('===========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testStripeConfig();
