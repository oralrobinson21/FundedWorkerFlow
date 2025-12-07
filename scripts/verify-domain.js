#!/usr/bin/env node

/**
 * Domain and SSL Verification Script
 * Verifies domain DNS, SSL certificate, and connectivity
 */

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

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

const DOMAIN = process.argv[2] || process.env.PRODUCTION_DOMAIN || '';

function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let output = '';
    let error = '';

    proc.stdout.on('data', data => output += data.toString());
    proc.stderr.on('data', data => error += data.toString());

    proc.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      timeout: 10000,
      rejectUnauthorized: true  // Check SSL validity
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          certificate: res.socket?.getPeerCertificate ? res.socket.getPeerCertificate() : null
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function verifyDomain() {
  console.log('\n===========================================');
  console.log('Domain and SSL Verification');
  console.log('===========================================\n');

  if (!DOMAIN) {
    log.error('No domain provided');
    log.info('Usage: node scripts/verify-domain.js your-domain.com');
    log.info('Or set PRODUCTION_DOMAIN environment variable');
    process.exit(1);
  }

  log.info(`Verifying domain: ${DOMAIN}\n`);

  const results = [];

  // Test 1: DNS Resolution
  try {
    log.info('Checking DNS resolution...');
    const output = await executeCommand('nslookup', [DOMAIN]);

    if (output.includes('Address:')) {
      const addresses = output.match(/Address:\s*(\S+)/g);
      if (addresses && addresses.length > 1) {  // First is DNS server
        const ip = addresses[1].split(':')[1].trim();
        log.success(`DNS resolved to: ${ip}`);
        results.push({ test: 'DNS Resolution', passed: true, ip });
      }
    } else {
      log.error('DNS resolution failed');
      results.push({ test: 'DNS Resolution', passed: false, error: 'No address found' });
    }
  } catch (error) {
    log.error(`DNS check failed: ${error.message}`);
    log.warning('nslookup command may not be available');
    results.push({ test: 'DNS Resolution', passed: false, error: error.message });
  }

  // Test 2: HTTPS Connectivity
  try {
    log.info('\nChecking HTTPS connectivity...');
    const response = await makeRequest(`https://${DOMAIN}/health`);

    if (response.status === 200) {
      log.success('HTTPS connection successful');
      results.push({ test: 'HTTPS Connectivity', passed: true });

      // Check SSL Certificate
      if (response.certificate) {
        const cert = response.certificate;
        log.info(`SSL issuer: ${cert.issuer?.O || 'Unknown'}`);
        log.info(`SSL valid from: ${new Date(cert.valid_from).toLocaleDateString()}`);
        log.info(`SSL valid until: ${new Date(cert.valid_to).toLocaleDateString()}`);

        const daysUntilExpiry = Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 30) {
          log.warning(`SSL certificate expires in ${daysUntilExpiry} days`);
        } else {
          log.success(`SSL certificate valid for ${daysUntilExpiry} days`);
        }

        results.push({ test: 'SSL Certificate', passed: true, daysValid: daysUntilExpiry });
      }
    } else {
      log.warning(`HTTPS returned status ${response.status}`);
      results.push({ test: 'HTTPS Connectivity', passed: true, note: `Status ${response.status}` });
    }
  } catch (error) {
    log.error(`HTTPS connection failed: ${error.message}`);
    if (error.message.includes('certificate')) {
      log.error('SSL certificate issue detected');
    }
    results.push({ test: 'HTTPS Connectivity', passed: false, error: error.message });
  }

  // Test 3: HTTP to HTTPS Redirect
  try {
    log.info('\nChecking HTTP to HTTPS redirect...');
    const response = await makeRequest(`http://${DOMAIN}/health`);

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (location && location.startsWith('https://')) {
        log.success('HTTP redirects to HTTPS');
        results.push({ test: 'HTTP Redirect', passed: true });
      } else {
        log.warning('HTTP redirect exists but not to HTTPS');
        results.push({ test: 'HTTP Redirect', passed: false, note: 'Not redirecting to HTTPS' });
      }
    } else if (response.status === 200) {
      log.warning('HTTP returns 200 (should redirect to HTTPS)');
      results.push({ test: 'HTTP Redirect', passed: false, note: 'No redirect configured' });
    }
  } catch (error) {
    log.warning(`HTTP check failed: ${error.message}`);
    results.push({ test: 'HTTP Redirect', passed: false, error: error.message });
  }

  // Test 4: API Endpoints via Domain
  try {
    log.info('\nTesting API endpoints via domain...');
    const endpoints = ['/health', '/api/health', '/api/stripe/config'];
    let passedCount = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await makeRequest(`https://${DOMAIN}${endpoint}`);
        if (response.status === 200) {
          log.success(`${endpoint}: OK`);
          passedCount++;
        } else {
          log.warning(`${endpoint}: Status ${response.status}`);
        }
      } catch (error) {
        log.error(`${endpoint}: Failed`);
      }
    }

    results.push({
      test: 'API Endpoints',
      passed: passedCount === endpoints.length,
      note: `${passedCount}/${endpoints.length} passed`
    });
  } catch (error) {
    results.push({ test: 'API Endpoints', passed: false, error: error.message });
  }

  // Summary
  console.log('\n===========================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    log.error('\nSome domain tests failed');
    console.log('\nRecommendations:');
    log.info('1. Verify DNS A/CNAME records point to correct IP');
    log.info('2. Ensure SSL certificate is valid and not expired');
    log.info('3. Configure HTTP to HTTPS redirect');
    log.info('4. Check Railway/hosting service configuration');
  } else {
    log.success('\nAll domain tests passed!');
    console.log('\nDomain is ready for production:');
    log.info(`- HTTPS: https://${DOMAIN}`);
    log.info('- SSL certificate valid');
    log.info('- API endpoints accessible');
  }

  console.log('===========================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Run verification
verifyDomain();
