#!/usr/bin/env node

/**
 * Health Monitoring Script
 * Continuously monitors backend health and alerts on failures
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

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

// Configuration
const API_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const CHECK_INTERVAL = parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'); // 30 seconds
const ALERT_THRESHOLD = parseInt(process.env.HEALTH_ALERT_THRESHOLD || '3'); // 3 failures
const LOG_DIR = path.join(__dirname, '..', 'logs');
const ALERT_LOG = path.join(LOG_DIR, 'health-alerts.log');

let failureCount = 0;
let lastStatus = 'unknown';

function logAlert(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Append to alert log
  fs.appendFileSync(ALERT_LOG, logMessage);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data
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

async function checkHealth() {
  const timestamp = new Date().toLocaleString();

  try {
    const response = await makeRequest(`${API_URL}/health`);

    if (response.status === 200) {
      if (lastStatus !== 'healthy') {
        log.success(`[${timestamp}] Backend is healthy (recovered from failure)`);
        if (failureCount >= ALERT_THRESHOLD) {
          logAlert(`Backend recovered after ${failureCount} failures`);
        }
        failureCount = 0;
        lastStatus = 'healthy';
      } else {
        // Only log periodic healthy status, not every check
        if (new Date().getSeconds() < 30) {
          log.info(`[${timestamp}] Backend is healthy`);
        }
      }
    } else {
      failureCount++;
      log.warning(`[${timestamp}] Backend returned status ${response.status} (failure ${failureCount}/${ALERT_THRESHOLD})`);

      if (failureCount >= ALERT_THRESHOLD) {
        const alertMsg = `Backend health check failing: ${response.status} (${failureCount} consecutive failures)`;
        log.error(alertMsg);
        logAlert(alertMsg);
        lastStatus = 'unhealthy';
      }
    }
  } catch (error) {
    failureCount++;
    log.error(`[${timestamp}] Backend unreachable: ${error.message} (failure ${failureCount}/${ALERT_THRESHOLD})`);

    if (failureCount >= ALERT_THRESHOLD) {
      const alertMsg = `Backend unreachable: ${error.message} (${failureCount} consecutive failures)`;
      logAlert(alertMsg);
      lastStatus = 'unreachable';
    }
  }
}

function startMonitoring() {
  console.log('\n===========================================');
  console.log('Health Monitoring Started');
  console.log('===========================================\n');
  log.info(`Monitoring: ${API_URL}`);
  log.info(`Check interval: ${CHECK_INTERVAL / 1000}s`);
  log.info(`Alert threshold: ${ALERT_THRESHOLD} failures`);
  log.info(`Alert log: ${ALERT_LOG}\n`);
  log.info('Press Ctrl+C to stop monitoring\n');

  // Initial check
  checkHealth();

  // Periodic checks
  setInterval(checkHealth, CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n===========================================');
  log.info('Stopping health monitor...');
  console.log('===========================================\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Start monitoring
startMonitoring();
