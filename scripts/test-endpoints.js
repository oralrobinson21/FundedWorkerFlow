#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * Tests all backend endpoints for availability and correct responses
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

// Get API URL from command line or default
const API_URL = process.argv[2] || process.env.API_BASE_URL || 'http://localhost:5001';

const ENDPOINTS = [
  { method: 'GET', path: '/health', expectedStatus: 200, description: 'Health check' },
  { method: 'GET', path: '/api/health', expectedStatus: 200, description: 'API health check' },
  { method: 'GET', path: '/api/test-email', expectedStatus: 200, description: 'Email test endpoint' },
  { method: 'GET', path: '/api/stripe/config', expectedStatus: 200, description: 'Stripe configuration' },
  { method: 'POST', path: '/api/auth/send-otp', expectedStatus: [200, 400], description: 'Send OTP' },
  { method: 'GET', path: '/api/tasks', expectedStatus: 200, description: 'Get tasks' }
];

function makeRequest(method, url) {
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
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (method === 'POST') {
      req.write(JSON.stringify({ email: 'test@example.com' }));
    }

    req.end();
  });
}

async function testEndpoint(endpoint) {
  const url = `${API_URL}${endpoint.path}`;

  try {
    const response = await makeRequest(endpoint.method, url);
    const expectedStatuses = Array.isArray(endpoint.expectedStatus)
      ? endpoint.expectedStatus
      : [endpoint.expectedStatus];

    if (expectedStatuses.includes(response.status)) {
      log.success(`${endpoint.method} ${endpoint.path} - ${endpoint.description} (${response.status})`);
      return { passed: true, endpoint: endpoint.path };
    } else {
      log.error(`${endpoint.method} ${endpoint.path} - Expected ${expectedStatuses.join('/')}, got ${response.status}`);
      return { passed: false, endpoint: endpoint.path, error: `Unexpected status ${response.status}` };
    }
  } catch (error) {
    log.error(`${endpoint.method} ${endpoint.path} - ${error.message}`);
    return { passed: false, endpoint: endpoint.path, error: error.message };
  }
}

async function runTests() {
  console.log('\n===========================================');
  console.log('API Endpoint Testing');
  console.log('===========================================\n');
  log.info(`Testing API at: ${API_URL}\n`);

  const results = [];

  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
  }

  // Summary
  console.log('\n===========================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    log.error('\nSome endpoints failed. Check backend logs for details.');
    console.log('===========================================\n');
    process.exit(1);
  } else {
    log.success('\nAll endpoints passed!');
    console.log('===========================================\n');
    process.exit(0);
  }
}

// Check if backend is reachable first
async function checkBackendReachable() {
  try {
    log.info('Checking if backend is reachable...');
    await makeRequest('GET', `${API_URL}/health`);
    log.success('Backend is reachable\n');
    return true;
  } catch (error) {
    log.error(`Backend not reachable at ${API_URL}`);
    log.error(`Error: ${error.message}`);
    log.info('\nMake sure backend is running with: ./master-start.sh');
    process.exit(1);
  }
}

// Run tests
(async () => {
  await checkBackendReachable();
  await runTests();
})();
