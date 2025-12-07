#!/usr/bin/env node

/**
 * Master Test Script for FundedWorkerFlow
 * Complete testing suite: environment, endpoints, Stripe, email, contact form, PM2
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  header: (msg) => console.log(`${COLORS.bold}${COLORS.cyan}${msg}${COLORS.reset}`),
  section: (msg) => console.log(`\n${COLORS.magenta}━━━ ${msg} ━━━${COLORS.reset}`)
};

const API_URL = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5001';
const CONTACT_EMAIL = 'citytask@outlook.com';

const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function recordTest(name, passed, error = null, warning = false) {
  testResults.tests.push({ name, passed, error, warning });
  if (warning) {
    testResults.warnings++;
  } else if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function makeRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (error) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
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

// ==========================================
// Phase 1: Environment Validation
// ==========================================
async function validateEnvironment() {
  log.section('Phase 1: Environment Validation');

  const envPath = path.join(__dirname, '..', 'backend', '.env');

  if (!fs.existsSync(envPath)) {
    log.error('backend/.env not found');
    recordTest('Environment File', false, 'backend/.env does not exist');
    return false;
  }

  log.success('backend/.env found');

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    { key: 'STRIPE_SECRET_KEY', pattern: /^sk_(test|live)_/ },
    { key: 'STRIPE_PUBLISHABLE_KEY', pattern: /^pk_(test|live)_/ },
    { key: 'STRIPE_WEBHOOK_SECRET', pattern: /^whsec_/ },
    { key: 'RESEND_API_KEY', pattern: /^re_/ },
    { key: 'BACKEND_PORT', pattern: /^\d+$/ },
    { key: 'API_BASE_URL', pattern: /^https?:\/\// },
    { key: 'DATABASE_URL', pattern: /^postgresql:\/\// }
  ];

  let allValid = true;

  for (const varConfig of requiredVars) {
    const regex = new RegExp(`${varConfig.key}=(.+)`, 'm');
    const match = envContent.match(regex);

    if (!match) {
      log.error(`${varConfig.key} not found`);
      recordTest(`Env: ${varConfig.key}`, false, 'Variable not found');
      allValid = false;
    } else {
      const value = match[1].trim();

      if (value.includes('XXXX') || value.includes('your-')) {
        log.error(`${varConfig.key} has placeholder value`);
        recordTest(`Env: ${varConfig.key}`, false, 'Placeholder value not replaced');
        allValid = false;
      } else if (!varConfig.pattern.test(value)) {
        log.warning(`${varConfig.key} format may be invalid`);
        recordTest(`Env: ${varConfig.key}`, true, null, true);
      } else {
        log.success(`${varConfig.key} configured`);
        recordTest(`Env: ${varConfig.key}`, true);
      }
    }
  }

  // Check PM2
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
    log.success('PM2 installed');
    recordTest('PM2 Installation', true);
  } catch (error) {
    log.error('PM2 not installed');
    recordTest('PM2 Installation', false, 'PM2 not found');
    allValid = false;
  }

  return allValid;
}

// ==========================================
// Phase 2: Backend Health & Connectivity
// ==========================================
async function testBackendHealth() {
  log.section('Phase 2: Backend Health & Connectivity');

  log.info(`Testing backend at: ${API_URL}`);

  // Test health endpoint
  try {
    const response = await makeRequest('GET', `${API_URL}/health`);

    if (response.status === 200) {
      log.success('/health endpoint responding');
      recordTest('Health Endpoint', true);
    } else {
      log.error(`/health returned ${response.status}`);
      recordTest('Health Endpoint', false, `Status ${response.status}`);
    }
  } catch (error) {
    log.error(`Cannot reach backend: ${error.message}`);
    recordTest('Backend Connectivity', false, error.message);
    return false;
  }

  // Test API health endpoint
  try {
    const response = await makeRequest('GET', `${API_URL}/api/health`);

    if (response.status === 200) {
      log.success('/api/health endpoint responding');
      recordTest('API Health Endpoint', true);
    } else {
      log.warning(`/api/health returned ${response.status}`);
      recordTest('API Health Endpoint', true, null, true);
    }
  } catch (error) {
    log.warning(`/api/health failed: ${error.message}`);
    recordTest('API Health Endpoint', true, null, true);
  }

  return true;
}

// ==========================================
// Phase 3: Core API Endpoints
// ==========================================
async function testCoreEndpoints() {
  log.section('Phase 3: Core API Endpoints');

  const endpoints = [
    { method: 'GET', path: '/api/tasks', expectedStatus: 200, description: 'Task listing' },
    { method: 'GET', path: '/api/stripe/config', expectedStatus: 200, description: 'Stripe config' },
    { method: 'POST', path: '/api/auth/send-otp', body: { email: 'test@example.com' }, expectedStatus: [200, 400], description: 'Send OTP' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.method, `${API_URL}${endpoint.path}`, endpoint.body);
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) ? endpoint.expectedStatus : [endpoint.expectedStatus];

      if (expectedStatuses.includes(response.status)) {
        log.success(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
        recordTest(`Endpoint: ${endpoint.path}`, true);
      } else {
        log.error(`${endpoint.method} ${endpoint.path} - Expected ${expectedStatuses.join('/')}, got ${response.status}`);
        recordTest(`Endpoint: ${endpoint.path}`, false, `Unexpected status ${response.status}`);
      }
    } catch (error) {
      log.error(`${endpoint.method} ${endpoint.path} - ${error.message}`);
      recordTest(`Endpoint: ${endpoint.path}`, false, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// ==========================================
// Phase 4: Stripe Integration
// ==========================================
async function testStripeIntegration() {
  log.section('Phase 4: Stripe Integration');

  // Test Stripe config endpoint
  try {
    const response = await makeRequest('GET', `${API_URL}/api/stripe/config`);

    if (response.status === 200 && response.body?.publishableKey) {
      const key = response.body.publishableKey;
      const keyType = key.startsWith('pk_test_') ? 'TEST' : key.startsWith('pk_live_') ? 'LIVE' : 'UNKNOWN';

      log.success(`Stripe config endpoint working (${keyType} keys)`);
      log.info(`Key: ${key.substring(0, 20)}...`);

      if (keyType === 'TEST') {
        log.warning('Using TEST keys - switch to LIVE for production');
      }

      recordTest('Stripe Config Endpoint', true);
      recordTest('Stripe Key Type', keyType === 'LIVE', null, keyType === 'TEST');
    } else {
      log.error('Stripe config endpoint failed');
      recordTest('Stripe Config Endpoint', false, `Status ${response.status}`);
    }
  } catch (error) {
    log.error(`Stripe config test failed: ${error.message}`);
    recordTest('Stripe Config Endpoint', false, error.message);
  }

  // Test webhook endpoint (should fail without signature)
  try {
    const response = await makeRequest('POST', `${API_URL}/api/stripe/webhook`, {});

    if (response.status === 400) {
      log.success('Stripe webhook endpoint exists (signature validation working)');
      recordTest('Stripe Webhook Endpoint', true);
    } else if (response.status === 404) {
      log.error('Stripe webhook endpoint not found');
      recordTest('Stripe Webhook Endpoint', false, 'Endpoint not found');
    } else {
      log.warning(`Webhook returned ${response.status}`);
      recordTest('Stripe Webhook Endpoint', true, null, true);
    }
  } catch (error) {
    log.error(`Stripe webhook test failed: ${error.message}`);
    recordTest('Stripe Webhook Endpoint', false, error.message);
  }

  // Verify platform fee configuration
  log.info('Verifying platform fee configuration...');
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const feeMatch = envContent.match(/PLATFORM_FEE_PERCENT=(\d+)/);

  if (feeMatch) {
    const fee = parseInt(feeMatch[1]);
    if (fee === 15) {
      log.success('Platform fee correctly set to 15%');
      recordTest('Platform Fee Configuration', true);
    } else {
      log.warning(`Platform fee is ${fee}% (expected 15%)`);
      recordTest('Platform Fee Configuration', true, null, true);
    }
  } else {
    log.warning('PLATFORM_FEE_PERCENT not found');
    recordTest('Platform Fee Configuration', true, null, true);
  }
}

// ==========================================
// Phase 5: Email System
// ==========================================
async function testEmailSystem() {
  log.section('Phase 5: Email System');

  // Test email endpoint
  try {
    log.info('Testing email endpoint...');
    const response = await makeRequest('GET', `${API_URL}/api/test-email?to=delivered@resend.dev`);

    if (response.status === 200 && response.body?.success) {
      log.success('Email test endpoint working');
      if (response.body.result?.id) {
        log.info(`Email sent: ${response.body.result.id}`);
      }
      recordTest('Email Test Endpoint', true);
    } else {
      log.error('Email test endpoint failed');
      recordTest('Email Test Endpoint', false, response.body?.error || 'Unknown error');
    }
  } catch (error) {
    log.error(`Email test failed: ${error.message}`);
    recordTest('Email Test Endpoint', false, error.message);
  }
}

// ==========================================
// Phase 6: Contact Form with Business Inquiry
// ==========================================
async function testContactForm() {
  log.section('Phase 6: Contact Form with Business Inquiry');

  const businessTypes = ['mechanic', 'electrician', 'plumbing', 'general'];

  log.info('Testing contact form endpoint...');

  for (const businessType of businessTypes) {
    try {
      const response = await makeRequest('POST', `${API_URL}/api/contact`, {
        email: `test-${businessType}@example.com`,
        message: `This is a test business inquiry for ${businessType} services. Testing automated contact form.`,
        businessType: businessType
      });

      if (response.status === 200 && response.body?.success) {
        log.success(`Contact form test passed for business type: ${businessType}`);
        recordTest(`Contact Form: ${businessType}`, true);
      } else {
        log.error(`Contact form failed for ${businessType}: ${response.status}`);
        recordTest(`Contact Form: ${businessType}`, false, response.body?.error || 'Unknown error');
      }
    } catch (error) {
      log.error(`Contact form test failed for ${businessType}: ${error.message}`);
      recordTest(`Contact Form: ${businessType}`, false, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log.info(`All contact form emails should be sent to: ${CONTACT_EMAIL}`);
}

// ==========================================
// Phase 7: PM2 Health Check
// ==========================================
async function testPM2Health() {
  log.section('Phase 7: PM2 Health Check');

  try {
    const output = execSync('pm2 list', { encoding: 'utf-8' });

    if (output.includes('fundedworker-backend')) {
      const lines = output.split('\n');
      const backendLine = lines.find(line => line.includes('fundedworker-backend'));

      if (backendLine && backendLine.includes('online')) {
        log.success('Backend running via PM2 (status: online)');
        recordTest('PM2 Backend Status', true);
      } else {
        log.warning('Backend process found but not online');
        recordTest('PM2 Backend Status', true, null, true);
      }

      // Check if health monitor is running
      if (output.includes('health-monitor')) {
        log.success('Health monitor running via PM2');
        recordTest('PM2 Health Monitor', true);
      } else {
        log.info('Health monitor not running (optional)');
        log.info('Start with: npm run monitor:bg');
      }
    } else {
      log.warning('Backend not running via PM2');
      log.info('Start with: npm run start:backend');
      recordTest('PM2 Backend Status', true, null, true);
    }
  } catch (error) {
    log.warning('Could not check PM2 status');
    recordTest('PM2 Status Check', true, null, true);
  }

  // Check logs directory
  const logsDir = path.join(__dirname, '..', 'logs');
  if (fs.existsSync(logsDir)) {
    log.success('Logs directory exists');
    const files = fs.readdirSync(logsDir);
    if (files.length > 0) {
      log.info(`${files.length} log files found`);
    }
    recordTest('Logs Directory', true);
  } else {
    log.warning('Logs directory not found');
    recordTest('Logs Directory', true, null, true);
  }
}

// ==========================================
// Phase 8: Optional Railway Deployment Test
// ==========================================
async function testRailwayDeployment() {
  log.section('Phase 8: Railway Deployment (Optional)');

  if (API_URL.includes('localhost')) {
    log.info('Testing local backend (skip Railway test)');
    log.info('To test Railway: node scripts/master-test.js https://your-app.railway.app');
    return;
  }

  log.info(`Testing deployed backend at: ${API_URL}`);

  // Test HTTPS connectivity
  try {
    const response = await makeRequest('GET', `${API_URL}/health`);

    if (response.status === 200) {
      log.success('Deployment is accessible via HTTPS');
      recordTest('Railway Deployment', true);
    } else {
      log.error(`Deployment returned ${response.status}`);
      recordTest('Railway Deployment', false, `Status ${response.status}`);
    }
  } catch (error) {
    log.error(`Cannot reach deployment: ${error.message}`);
    recordTest('Railway Deployment', false, error.message);
  }
}

// ==========================================
// Final Summary
// ==========================================
function printSummary() {
  console.log('\n');
  log.header('═══════════════════════════════════════════');
  log.header('           MASTER TEST SUMMARY             ');
  log.header('═══════════════════════════════════════════');
  console.log('');

  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? Math.round((testResults.passed / total) * 100) : 0;

  console.log(`${COLORS.bold}Total Tests:${COLORS.reset} ${total}`);
  console.log(`${COLORS.green}${COLORS.bold}Passed:${COLORS.reset} ${testResults.passed}`);
  console.log(`${COLORS.red}${COLORS.bold}Failed:${COLORS.reset} ${testResults.failed}`);
  console.log(`${COLORS.yellow}${COLORS.bold}Warnings:${COLORS.reset} ${testResults.warnings}`);
  console.log(`${COLORS.cyan}${COLORS.bold}Pass Rate:${COLORS.reset} ${passRate}%`);
  console.log('');

  if (testResults.failed > 0) {
    log.header('Failed Tests:');
    testResults.tests
      .filter(t => !t.passed && !t.warning)
      .forEach(t => {
        log.error(`${t.name}: ${t.error || 'Failed'}`);
      });
    console.log('');
  }

  if (testResults.warnings > 0) {
    log.header('Warnings:');
    testResults.tests
      .filter(t => t.warning)
      .forEach(t => {
        log.warning(`${t.name}: ${t.error || 'Check configuration'}`);
      });
    console.log('');
  }

  // Recommendations
  if (testResults.failed > 0 || testResults.warnings > 0) {
    log.header('Recommendations:');

    if (testResults.tests.some(t => t.name.startsWith('Env:') && !t.passed)) {
      log.info('1. Check backend/.env and verify all API keys');
    }

    if (testResults.tests.some(t => t.name.includes('Stripe') && !t.passed)) {
      log.info('2. Verify Stripe keys in Stripe dashboard');
      log.info('3. Set up webhook: https://dashboard.stripe.com/webhooks');
    }

    if (testResults.tests.some(t => t.name.includes('Email') && !t.passed)) {
      log.info('4. Check RESEND_API_KEY in backend/.env');
      log.info('5. Verify Resend dashboard: https://resend.com/emails');
    }

    if (testResults.tests.some(t => t.name.includes('Backend') && !t.passed)) {
      log.info('6. Start backend with: npm run start:backend');
      log.info('7. Check logs with: npm run logs');
    }

    console.log('');
  }

  log.header('═══════════════════════════════════════════');

  if (testResults.failed === 0) {
    log.success('ALL TESTS PASSED! System is ready for production! 🎉');
  } else {
    log.error('Some tests failed. Fix issues above before deploying.');
  }

  log.header('═══════════════════════════════════════════');
  console.log('');
}

// ==========================================
// Main Execution
// ==========================================
async function main() {
  console.log('');
  log.header('═══════════════════════════════════════════');
  log.header('   FundedWorkerFlow Master Test Script    ');
  log.header('═══════════════════════════════════════════');
  console.log('');

  try {
    const envValid = await validateEnvironment();
    if (!envValid) {
      log.error('Environment validation failed. Fix errors before continuing.');
      printSummary();
      process.exit(1);
    }

    const backendReachable = await testBackendHealth();
    if (!backendReachable) {
      log.error('Backend is not reachable. Start backend and try again.');
      log.info('Start backend with: npm run start:backend');
      printSummary();
      process.exit(1);
    }

    await testCoreEndpoints();
    await testStripeIntegration();
    await testEmailSystem();
    await testContactForm();
    await testPM2Health();
    await testRailwayDeployment();

    printSummary();

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    log.error(`Master test failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
main();
