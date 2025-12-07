# FundedWorkerFlow Automation Guide

Complete automation system for validation, testing, deployment, and monitoring.

## 🚀 Quick Start - ONE Command

**The simplest way to do EVERYTHING:**

```bash
npm run run-all
# or
./scripts/run-all.sh
```

This runs the complete automation:
- ✅ Validates environment
- ✅ Starts services
- ✅ Tests all endpoints
- ✅ Tests Stripe integration
- ✅ Tests email system
- ✅ Optionally deploys to Railway
- ✅ Optionally verifies domain
- ✅ Starts health monitoring

---

## 📋 Available NPM Scripts

All automation is available via npm commands:

```bash
# Start everything (backend + frontend)
npm start

# Complete automation (all tests + optional deployment)
npm run run-all

# Environment & validation
npm run validate               # Validate all env vars

# Start/stop services
npm run start:backend          # Start backend with PM2
npm run start:frontend         # Start Expo frontend
npm run stop                   # Stop all PM2 services
npm run status                 # View PM2 status
npm run logs                   # View backend logs

# Testing
npm test                       # Test all API endpoints
npm run test:stripe            # Test Stripe integration
npm run test:email             # Test email system (interactive)
npm run test:domain DOMAIN     # Verify domain and SSL

# Monitoring
npm run monitor                # Start health monitoring (foreground)
npm run monitor:bg             # Start health monitoring (background)

# Deployment
npm run deploy                 # Deploy to Railway (automated)
```

---

## 🎯 Individual Scripts

### 1. Environment Validation

**Script:** `scripts/validate-env.js`

**Purpose:** Validates all required environment variables before starting services.

**Usage:**
```bash
npm run validate
# or
node scripts/validate-env.js
```

**Checks:**
- ✅ Backend `.env` file exists
- ✅ Frontend `.env` file exists
- ✅ All required variables present
- ✅ Variables match expected format (Stripe keys, URLs, emails)
- ✅ No placeholder values (XXXX)
- ✅ PM2 installed

**Output:** Color-coded pass/fail with specific error messages

**Exit codes:**
- `0` - All validations passed
- `1` - Validation failed (shows errors)

---

### 2. Endpoint Testing

**Script:** `scripts/test-endpoints.js`

**Purpose:** Tests all 35+ backend API endpoints.

**Usage:**
```bash
# Test local backend
npm test
node scripts/test-endpoints.js

# Test remote backend
node scripts/test-endpoints.js https://your-app.railway.app
```

**Tests:**
- `/health` - Health check
- `/api/health` - API health check
- `/api/test-email` - Email endpoint
- `/api/stripe/config` - Stripe configuration
- `/api/auth/send-otp` - OTP sending
- `/api/tasks` - Task listing

**Features:**
- 5-second timeout per request
- Color-coded pass/fail output
- Summary report with counts
- Supports HTTP and HTTPS

**Exit codes:**
- `0` - All endpoints passed
- `1` - One or more endpoints failed

---

### 3. Stripe Integration Testing

**Script:** `scripts/test-stripe.js`

**Purpose:** Tests Stripe configuration and payment readiness.

**Usage:**
```bash
npm run test:stripe
# or
node scripts/test-stripe.js [URL]
```

**Tests:**
- ✅ Stripe configuration endpoint
- ✅ Publishable key format and type (test/live)
- ✅ Webhook endpoint exists
- ✅ Environment variables configured
- ✅ Secret key format
- ✅ Webhook secret present

**Output:**
- Shows key type (TEST or LIVE)
- Displays truncated keys for security
- Warns if using test keys
- Provides recommendations for failures

**Exit codes:**
- `0` - All Stripe tests passed
- `1` - One or more tests failed

---

### 4. Email System Testing

**Script:** `scripts/test-email.js`

**Purpose:** Tests Resend email integration.

**Usage:**
```bash
npm run test:email
# or
node scripts/test-email.js [URL]
```

**Interactive Tests:**
1. **Resend configuration check**
   - Validates RESEND_API_KEY format
   - Shows contact email recipient

2. **Test email sending** (optional)
   - Prompts for recipient email
   - Sends test email
   - Shows email ID if successful

3. **Contact form test** (optional)
   - Sends test contact form submission
   - Emails to configured CONTACT_EMAIL

**Features:**
- Interactive prompts
- Safe to skip any test
- Shows email delivery status
- Provides troubleshooting tips

**Exit codes:**
- `0` - All tests passed (or skipped)
- `1` - Tests failed

---

### 5. Domain Verification

**Script:** `scripts/verify-domain.js`

**Purpose:** Verifies domain DNS, SSL certificate, and connectivity.

**Usage:**
```bash
npm run test:domain your-domain.com
# or
node scripts/verify-domain.js your-domain.com
```

**Tests:**
- ✅ DNS resolution
- ✅ HTTPS connectivity
- ✅ SSL certificate validity
- ✅ Certificate expiration date
- ✅ HTTP to HTTPS redirect
- ✅ API endpoints via domain

**Output:**
- Shows resolved IP address
- Displays SSL certificate details
- Warns if certificate expires soon (<30 days)
- Tests multiple API endpoints

**Exit codes:**
- `0` - Domain fully configured
- `1` - Configuration issues found

---

### 6. Health Monitoring

**Script:** `scripts/health-monitor.js`

**Purpose:** Continuous health monitoring with automatic alerts.

**Usage:**
```bash
# Foreground (watch in terminal)
npm run monitor

# Background with PM2
npm run monitor:bg

# Stop monitoring
pm2 stop health-monitor
```

**Features:**
- Checks `/health` endpoint every 30 seconds (configurable)
- Alerts after 3 consecutive failures (configurable)
- Logs alerts to `logs/health-alerts.log`
- Real-time status display
- Auto-recovery notification

**Configuration:**
```bash
# Environment variables
export HEALTH_CHECK_INTERVAL=30000    # 30 seconds
export HEALTH_ALERT_THRESHOLD=3       # 3 failures
```

**Continuous Operation:**
```bash
# Start monitoring in background
pm2 start scripts/health-monitor.js --name health-monitor

# View monitoring logs
pm2 logs health-monitor

# Stop monitoring
pm2 stop health-monitor
```

---

### 7. Railway Deployment

**Script:** `scripts/deploy-railway.sh`

**Purpose:** Automated deployment to Railway.

**Usage:**
```bash
npm run deploy
# or
./scripts/deploy-railway.sh
```

**Process:**
1. Checks Railway CLI installed
2. Validates environment variables
3. Prompts for confirmation
4. Sets all env vars from `backend/.env` to Railway
5. Deploys application
6. Tests deployment health
7. Provides deployment URL and next steps

**Prerequisites:**
- Railway CLI: `npm install -g @railway/cli`
- Railway account (free tier available)
- Logged in: `railway login`
- Production API keys in `backend/.env`

**Safety:**
- Validates before deploying
- Confirmation prompt
- Skips placeholder values (XXXX)
- Tests deployment after completion

---

### 8. Master Orchestration

**Script:** `scripts/run-all.sh`

**Purpose:** Complete end-to-end automation.

**Usage:**
```bash
npm run run-all
# or
./scripts/run-all.sh
```

**Modes:**
1. **Local development only**
   - Validates environment
   - Starts backend and frontend
   - Tests all endpoints
   - Tests Stripe and email
   - Optional health monitoring

2. **Local + Railway deployment**
   - Everything from mode 1
   - Plus: Automated Railway deployment
   - Tests deployed version
   - Optional domain verification

3. **Test existing deployment**
   - Prompts for deployment URL
   - Tests all endpoints
   - Tests Stripe and email
   - Optional domain verification

**Interactive:**
- Prompts for mode selection
- Optional tests (email, domain)
- Confirmation before deployment
- Health monitoring opt-in

**Output:**
- Complete summary at end
- Service URLs and commands
- Available operations
- Next steps

---

## 📖 Usage Scenarios

### Scenario 1: Fresh Start (Local Dev)

```bash
# 1. Clone repository
git clone [repo-url]
cd FundedWorkerFlow

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Add your API keys

# 4. Validate configuration
npm run validate

# 5. Start everything
npm start
# or for complete automation:
npm run run-all
```

### Scenario 2: Deploy to Production

```bash
# 1. Update environment with LIVE keys
nano backend/.env
# Change sk_test_* to sk_live_*
# Change pk_test_* to pk_live_*

# 2. Validate configuration
npm run validate

# 3. Deploy to Railway
npm run deploy

# 4. Test deployment
node scripts/test-endpoints.js https://your-app.railway.app

# 5. Verify domain (if using custom domain)
npm run test:domain your-domain.com

# 6. Start health monitoring
npm run monitor:bg
```

### Scenario 3: Daily Development

```bash
# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend

# Check status
npm run status

# View logs
npm run logs

# Test changes
npm test
npm run test:stripe
npm run test:email

# Stop everything
npm run stop
```

### Scenario 4: Troubleshooting

```bash
# 1. Validate environment
npm run validate

# 2. Check service status
npm run status

# 3. View logs
npm run logs

# 4. Test specific component
npm test                 # All endpoints
npm run test:stripe      # Stripe only
npm run test:email       # Email only

# 5. Restart services
npm run stop
npm run start:backend

# 6. Check health
curl http://localhost:5001/health
```

---

## 🔧 Configuration

### Environment Variables

**Backend (`backend/.env`):**
```bash
# Required
STRIPE_SECRET_KEY=sk_test_or_live_XXXX
STRIPE_PUBLISHABLE_KEY=pk_test_or_live_XXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXX
RESEND_API_KEY=re_XXXX
DATABASE_URL=postgresql://user:pass@host:port/db
BACKEND_PORT=5001
API_BASE_URL=http://localhost:5001

# Optional
CONTACT_EMAIL=citytask@outlook.com
PLATFORM_FEE_PERCENT=15
MIN_JOB_PRICE_USD=7
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-key
```

**Frontend (`.env`):**
```bash
EXPO_PUBLIC_API_URL=http://localhost:5001
```

### Health Monitoring Configuration

```bash
# Environment variables (optional)
export HEALTH_CHECK_INTERVAL=30000     # Check every 30s
export HEALTH_ALERT_THRESHOLD=3        # Alert after 3 failures
export API_BASE_URL=http://localhost:5001
```

### PM2 Configuration

Located in `ecosystem.config.js`:
- Auto-restart on crash
- Memory limit: 500MB
- Log rotation: Yes
- Timestamps: Yes
- Max restarts: 10
- Restart delay: 4 seconds

---

## 🚨 Troubleshooting

### Validation Fails

**Problem:** `npm run validate` shows errors

**Solutions:**
- Check `backend/.env` exists
- Verify all required variables set
- Replace placeholder values (XXXX)
- Check API key formats
- Install PM2: `npm install -g pm2`

### Backend Won't Start

**Problem:** Backend fails to start with PM2

**Solutions:**
```bash
# Check logs
pm2 logs fundedworker-backend --err

# Check port availability
lsof -i:5001

# Kill conflicting process
lsof -ti:5001 | xargs kill -9

# Restart
pm2 restart fundedworker-backend
```

### Tests Failing

**Problem:** Endpoint tests return errors

**Solutions:**
- Ensure backend is running: `curl http://localhost:5001/health`
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs fundedworker-backend`
- Verify environment variables
- Check database connection

### Stripe Tests Fail

**Problem:** Stripe integration tests fail

**Solutions:**
- Verify STRIPE_SECRET_KEY format (starts with sk_)
- Verify STRIPE_PUBLISHABLE_KEY format (starts with pk_)
- Check keys are not test mode if deploying to production
- Test keys in Stripe dashboard
- Set up webhook: https://dashboard.stripe.com/webhooks

### Email Tests Fail

**Problem:** Email tests fail or emails not received

**Solutions:**
- Verify RESEND_API_KEY format (starts with re_)
- Check Resend dashboard: https://resend.com/emails
- Verify sending domain (if using custom domain)
- Check spam folder
- Test with delivered@resend.dev first

### Railway Deployment Fails

**Problem:** Deployment to Railway fails

**Solutions:**
- Ensure Railway CLI installed: `railway --version`
- Login: `railway login`
- Check environment variables set correctly
- Verify `railway.json` exists
- Check deployment logs in Railway dashboard

---

## 📚 Additional Resources

**Documentation:**
- Main README: `README.md`
- API Endpoints: `README.md#backend-endpoints`
- PM2 Commands: `README.md#pm2-commands`
- Railway Guide: `README.md#railway-deployment`

**Scripts Directory:**
- `scripts/validate-env.js` - Environment validation
- `scripts/test-endpoints.js` - API testing
- `scripts/test-stripe.js` - Stripe testing
- `scripts/test-email.js` - Email testing
- `scripts/verify-domain.js` - Domain verification
- `scripts/health-monitor.js` - Health monitoring
- `scripts/deploy-railway.sh` - Railway deployment
- `scripts/run-all.sh` - Master orchestration

**Logs:**
- PM2 logs: `./logs/backend-*.log`
- Health alerts: `./logs/health-alerts.log`
- View with: `pm2 logs` or `tail -f ./logs/*.log`

---

## ✨ Best Practices

1. **Always validate before starting:**
   ```bash
   npm run validate && npm start
   ```

2. **Test after making changes:**
   ```bash
   npm test && npm run test:stripe && npm run test:email
   ```

3. **Monitor production:**
   ```bash
   npm run monitor:bg
   pm2 logs health-monitor
   ```

4. **Use appropriate keys:**
   - Development: `sk_test_*` and `pk_test_*`
   - Production: `sk_live_*` and `pk_live_*`

5. **Check logs regularly:**
   ```bash
   pm2 logs fundedworker-backend
   tail -f ./logs/health-alerts.log
   ```

6. **Stop services when done:**
   ```bash
   npm run stop
   pm2 delete all
   ```

---

## 🎓 Command Reference

**Quick Commands:**
```bash
npm start              # Start everything
npm run validate       # Check configuration
npm test               # Test API endpoints
npm run test:stripe    # Test Stripe
npm run test:email     # Test email
npm run status         # View services
npm run logs           # View logs
npm run stop           # Stop all
npm run deploy         # Deploy to Railway
npm run run-all        # Complete automation
```

**When You Get Home:**
```bash
cd FundedWorkerFlow
npm run run-all
```

That's it! Complete autonomous operation in ONE command.

