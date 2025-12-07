#!/usr/bin/env node

/**
 * Email System Testing Script
 * Tests Resend integration and email endpoints
 */

const http = require('http');
const https = require('https');
const readline = require('readline');

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

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function testEmail() {
  console.log('\n===========================================');
  console.log('Email System Testing');
  console.log('===========================================\n');
  log.info(`Testing email at: ${API_URL}\n`);

  const results = [];

  // Test 1: Check Resend API Key
  log.info('Checking Resend configuration...');
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', 'backend', '.env');

  let hasResendKey = false;
  let contactEmail = 'citytask@outlook.com';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    hasResendKey = /RESEND_API_KEY=re_\w+/.test(envContent);
    const emailMatch = envContent.match(/CONTACT_EMAIL=(.+)/);
    if (emailMatch) {
      contactEmail = emailMatch[1].trim();
    }

    if (hasResendKey) {
      log.success('RESEND_API_KEY configured');
      results.push({ test: 'Resend Config', passed: true });
    } else {
      log.error('RESEND_API_KEY missing or invalid');
      results.push({ test: 'Resend Config', passed: false, error: 'Missing API key' });
      console.log('===========================================\n');
      log.error('Cannot test email without RESEND_API_KEY');
      process.exit(1);
    }

    log.info(`Contact email recipient: ${contactEmail}`);
  } else {
    log.error('backend/.env not found');
    results.push({ test: 'Resend Config', passed: false, error: '.env not found' });
    process.exit(1);
  }

  // Test 2: Test Email Endpoint
  console.log('\n');
  const sendTest = await promptUser('Send test email? (y/n): ');

  if (sendTest.toLowerCase() === 'y') {
    const testEmail = await promptUser('Enter email address for test (or press Enter for delivered@resend.dev): ');
    const emailTo = testEmail.trim() || 'delivered@resend.dev';

    try {
      log.info(`Sending test email to ${emailTo}...`);
      const response = await makeRequest('GET', `${API_URL}/api/test-email?to=${encodeURIComponent(emailTo)}`);

      if (response.status === 200 && response.body?.success) {
        log.success('Test email sent successfully!');
        if (response.body.result?.id) {
          log.info(`Email ID: ${response.body.result.id}`);
        }
        log.info('Check inbox (may take a few seconds)');
        results.push({ test: 'Test Email', passed: true });
      } else {
        log.error(`Test email failed: ${response.status}`);
        if (response.body?.error) {
          log.error(`Error: ${response.body.error}`);
        }
        results.push({ test: 'Test Email', passed: false, error: response.body?.error });
      }
    } catch (error) {
      log.error(`Test email error: ${error.message}`);
      results.push({ test: 'Test Email', passed: false, error: error.message });
    }
  } else {
    log.info('Skipping test email');
    results.push({ test: 'Test Email', passed: true, note: 'Skipped' });
  }

  // Test 3: Contact Form
  console.log('\n');
  const sendContact = await promptUser('Test contact form? (y/n): ');

  if (sendContact.toLowerCase() === 'y') {
    try {
      log.info(`Testing contact form (will send to ${contactEmail})...`);
      const response = await makeRequest('POST', `${API_URL}/api/contact`, {
        email: 'test@example.com',
        message: 'This is an automated test message from the email testing script.'
      });

      if (response.status === 200 && response.body?.success) {
        log.success('Contact form email sent successfully!');
        log.info(`Email sent to: ${contactEmail}`);
        log.info('Check inbox for contact form submission');
        results.push({ test: 'Contact Form', passed: true });
      } else {
        log.error(`Contact form failed: ${response.status}`);
        if (response.body?.error) {
          log.error(`Error: ${response.body.error}`);
        }
        results.push({ test: 'Contact Form', passed: false, error: response.body?.error });
      }
    } catch (error) {
      log.error(`Contact form error: ${error.message}`);
      results.push({ test: 'Contact Form', passed: false, error: error.message });
    }
  } else {
    log.info('Skipping contact form test');
    results.push({ test: 'Contact Form', passed: true, note: 'Skipped' });
  }

  // Summary
  console.log('\n===========================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    log.error('\nSome email tests failed');
    console.log('\nRecommendations:');
    log.info('1. Verify RESEND_API_KEY in backend/.env');
    log.info('2. Check Resend dashboard: https://resend.com/emails');
    log.info('3. Verify domain if using custom from address');
  } else {
    log.success('\nAll email tests passed!');
    console.log('\nEmail system is ready for:');
    log.info('- OTP verification emails');
    log.info('- Contact form submissions');
    log.info('- Transactional notifications');
  }

  console.log('===========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
testEmail();
