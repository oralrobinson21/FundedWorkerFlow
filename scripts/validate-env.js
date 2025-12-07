#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables before starting services
 */

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

// Required environment variables
const REQUIRED_BACKEND_VARS = [
  { key: 'STRIPE_SECRET_KEY', pattern: /^sk_(test|live)_/, description: 'Stripe secret key' },
  { key: 'STRIPE_PUBLISHABLE_KEY', pattern: /^pk_(test|live)_/, description: 'Stripe publishable key' },
  { key: 'STRIPE_WEBHOOK_SECRET', pattern: /^whsec_/, description: 'Stripe webhook secret' },
  { key: 'RESEND_API_KEY', pattern: /^re_/, description: 'Resend API key' },
  { key: 'BACKEND_PORT', pattern: /^\d+$/, description: 'Backend port number' },
  { key: 'API_BASE_URL', pattern: /^https?:\/\//, description: 'Backend API URL' },
  { key: 'DATABASE_URL', pattern: /^postgresql:\/\//, description: 'PostgreSQL connection URL' }
];

const OPTIONAL_BACKEND_VARS = [
  { key: 'CONTACT_EMAIL', pattern: /.+@.+\..+/, description: 'Contact form recipient email' },
  { key: 'SUPABASE_URL', pattern: /^https:\/\//, description: 'Supabase project URL' },
  { key: 'SUPABASE_KEY', pattern: /.+/, description: 'Supabase anon key' },
  { key: 'PLATFORM_FEE_PERCENT', pattern: /^\d+$/, description: 'Platform fee percentage' },
  { key: 'MIN_JOB_PRICE_USD', pattern: /^\d+$/, description: 'Minimum job price' }
];

const REQUIRED_FRONTEND_VARS = [
  { key: 'EXPO_PUBLIC_API_URL', pattern: /^https?:\/\//, description: 'Frontend API URL' }
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        env[key.trim()] = value;
      }
    }
  });

  return env;
}

function validateVar(envVars, varConfig) {
  const value = envVars[varConfig.key];

  if (!value) {
    return { valid: false, message: 'Missing' };
  }

  if (value.includes('XXXX') || value === 'your-' || value.startsWith('http://localhost') && varConfig.key.includes('URL')) {
    return { valid: false, message: 'Placeholder value not replaced' };
  }

  if (varConfig.pattern && !varConfig.pattern.test(value)) {
    return { valid: false, message: 'Invalid format' };
  }

  return { valid: true, message: 'OK' };
}

function validateEnvironment() {
  console.log('\n===========================================');
  console.log('Environment Variables Validation');
  console.log('===========================================\n');

  let hasErrors = false;
  let hasWarnings = false;

  // Check Backend .env
  log.info('Checking backend/.env...');
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
  const backendEnv = loadEnvFile(backendEnvPath);

  if (!backendEnv) {
    log.error('backend/.env file not found!');
    log.info('Copy backend/.env.example to backend/.env and add your API keys');
    hasErrors = true;
  } else {
    log.success('backend/.env file found\n');

    // Validate required variables
    console.log('Required Backend Variables:');
    REQUIRED_BACKEND_VARS.forEach(varConfig => {
      const result = validateVar(backendEnv, varConfig);
      if (result.valid) {
        log.success(`${varConfig.key}: ${result.message}`);
      } else {
        log.error(`${varConfig.key}: ${result.message} - ${varConfig.description}`);
        hasErrors = true;
      }
    });

    // Validate optional variables
    console.log('\nOptional Backend Variables:');
    OPTIONAL_BACKEND_VARS.forEach(varConfig => {
      const result = validateVar(backendEnv, varConfig);
      if (result.valid) {
        log.success(`${varConfig.key}: ${result.message}`);
      } else if (backendEnv[varConfig.key]) {
        log.warning(`${varConfig.key}: ${result.message}`);
        hasWarnings = true;
      } else {
        log.warning(`${varConfig.key}: Not set (optional)`);
      }
    });
  }

  // Check Frontend .env
  console.log('\n');
  log.info('Checking root .env (frontend)...');
  const frontendEnvPath = path.join(__dirname, '..', '.env');
  const frontendEnv = loadEnvFile(frontendEnvPath);

  if (!frontendEnv) {
    log.error('Root .env file not found!');
    log.info('Create .env in project root with EXPO_PUBLIC_API_URL');
    hasErrors = true;
  } else {
    log.success('Root .env file found\n');

    console.log('Frontend Variables:');
    REQUIRED_FRONTEND_VARS.forEach(varConfig => {
      const result = validateVar(frontendEnv, varConfig);
      if (result.valid) {
        log.success(`${varConfig.key}: ${result.message}`);
      } else {
        log.error(`${varConfig.key}: ${result.message} - ${varConfig.description}`);
        hasErrors = true;
      }
    });
  }

  // Check PM2
  console.log('\n');
  log.info('Checking PM2 installation...');
  try {
    require('child_process').execSync('pm2 --version', { stdio: 'ignore' });
    log.success('PM2 is installed');
  } catch (error) {
    log.error('PM2 not installed');
    log.info('Install with: npm install -g pm2');
    hasErrors = true;
  }

  // Summary
  console.log('\n===========================================');
  if (hasErrors) {
    log.error('Validation FAILED - Fix errors above before starting');
    console.log('===========================================\n');
    process.exit(1);
  } else if (hasWarnings) {
    log.warning('Validation completed with warnings');
    log.info('Optional features may not work without additional configuration');
    console.log('===========================================\n');
    process.exit(0);
  } else {
    log.success('Validation PASSED - All required variables configured');
    console.log('===========================================\n');
    process.exit(0);
  }
}

// Run validation
validateEnvironment();
