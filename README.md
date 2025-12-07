# FundedWorkerFlow (CityTasks)

Full-stack task marketplace app with Stripe payments, email notifications, and auto-recovery monitoring.

## Features

- **Backend API**: 35+ endpoints for auth, tasks, payments, disputes, chat
- **Stripe Connect**: 15% platform fee, automatic payouts to workers
- **Email System**: OTP verification, contact forms via Resend
- **Auto-Recovery**: PM2 monitoring with crash recovery
- **Mobile Ready**: Expo React Native with tunnel access

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- PM2 (install globally: `npm install -g pm2`)
- Stripe account (test/live keys)
- Resend API key

### Installation

1. **Clone and install dependencies:**
```bash
cd FundedWorkerFlow
npm install
cd backend && npm install && cd ..
```

2. **Configure environment variables:**
```bash
# Copy templates
cp backend/.env.example backend/.env

# Edit backend/.env with your real API keys:
# - STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
# - RESEND_API_KEY
# - DATABASE_URL
# - CONTACT_EMAIL (for contact forms)
```

3. **Start everything:**
```bash
./master-start.sh
```

This will:
- Auto-detect your local IP
- Kill old processes on ports 5001, 8081-8084
- Start backend via PM2 with auto-restart
- Start Expo with tunnel for mobile access

---

## Project Structure

```
FundedWorkerFlow/
├── master-start.sh           # One-command startup
├── ecosystem.config.js       # PM2 auto-restart config
├── railway.json              # Railway deployment config
├── .env                      # Frontend env vars
├── scripts/
│   ├── validate-env.js       # Environment validation
│   ├── test-endpoints.js     # API endpoint testing
│   ├── health-monitor.js     # Health monitoring
│   └── deploy-railway.sh     # Railway deployment automation
├── backend/
│   ├── server.full.js        # Production backend (35+ endpoints)
│   ├── server.js             # Development backend (same)
│   ├── stripeClient.js       # Stripe SDK with direct env vars
│   ├── lib/resend.js         # Email utilities (OTP, contact, generic)
│   ├── .env                  # Backend API keys (gitignored)
│   └── .env.example          # Template for backend env
├── utils/api.ts              # Frontend API configuration
├── app.json                  # Expo config
├── logs/                     # PM2 logs (auto-created)
└── ...                       # Other frontend assets
```

---

## Backend Endpoints

### Health & Testing
- `GET /health` - Health check
- `GET /api/test-email` - Test Resend integration

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login/signup

### User Management
- `PUT /api/users/:userId` - Update user profile
- `PUT /api/users/:userId/photo` - Upload profile photo
- `GET /api/users/:userId/has-photo` - Check if user has photo

### Tasks
- `GET /api/tasks` - List all tasks (with filters)
- `POST /api/tasks` - Create new task ($7 minimum)
- `GET /api/tasks/:taskId` - Get task details
- `GET /api/my-tasks` - Get my posted tasks
- `GET /api/my-jobs` - Get my accepted jobs

### Offers & Payments
- `POST /api/tasks/:taskId/offers` - Send offer to task
- `GET /api/tasks/:taskId/offers` - Get all offers for task
- `POST /api/tasks/:taskId/choose-helper` - Choose helper (create Stripe checkout)

### Task Management
- `POST /api/tasks/:taskId/complete` - Mark task complete
- `POST /api/tasks/:taskId/cancel` - Cancel task
- `POST /api/tasks/:taskId/dispute` - File dispute

### Extra Work & Tips
- `POST /api/tasks/:taskId/extra-work` - Request extra payment
- `POST /api/extra-work/:requestId/accept` - Accept extra work (Stripe checkout)
- `POST /api/extra-work/:requestId/decline` - Decline extra work
- `POST /api/tasks/:taskId/tip` - Leave tip (Stripe checkout)

### Chat
- `GET /api/chat/threads` - Get all chat threads
- `GET /api/chat/threads/:threadId/messages` - Get messages
- `POST /api/chat/threads/:threadId/messages` - Send message

### Disputes
- `GET /api/disputes/:disputeId` - Get dispute details
- `POST /api/disputes/:disputeId/evidence` - Add evidence photos

### Contact Form
- `POST /api/contact` - Send contact form email to `CONTACT_EMAIL`

### Stripe
- `GET /api/stripe/config` - Get publishable key
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/stripe/connect/onboard` - Start Stripe Connect onboarding
- `GET /api/stripe/connect/status` - Check Stripe account status

### Activity Logs
- `GET /api/activity-logs` - Get activity logs (with filters)

---

## Environment Variables

### Backend (`backend/.env`)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_XXXXXXXX          # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXX    # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXX       # Webhook signing secret
STRIPE_CONNECT_CLIENT_ID=ca_XXXXXXXX       # Optional: Connect client ID

# API Settings
BACKEND_PORT=5001                           # Backend port (standardized)
API_BASE_URL=http://localhost:5001         # Backend URL
FRONTEND_URL=http://localhost:8081         # Frontend URL for redirects

# Business Rules
PLATFORM_FEE_PERCENT=15                    # Platform fee (15%)
MIN_JOB_PRICE_USD=7                        # Minimum task price ($7)

# Email
RESEND_API_KEY=re_XXXXXXXX                 # Resend API key
CONTACT_EMAIL=citytask@outlook.com         # Receive contact form emails

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db  # PostgreSQL connection

# File Storage
SUPABASE_URL=https://xxx.supabase.co       # Supabase project URL
SUPABASE_KEY=your-anon-key                  # Supabase anon key
```

### Frontend (`.env`)

```bash
EXPO_PUBLIC_API_URL=http://localhost:5001  # Backend API URL
```

---

## PM2 Commands

PM2 manages the backend with automatic restart on crash or high memory usage.

```bash
# View status
pm2 status

# View logs
pm2 logs fundedworker-backend

# View real-time monitoring dashboard
pm2 monit

# Restart backend
pm2 restart fundedworker-backend

# Stop backend
pm2 stop fundedworker-backend

# Delete process
pm2 delete fundedworker-backend

# View error logs only
pm2 logs fundedworker-backend --err

# Clear logs
pm2 flush
```

**PM2 Auto-Recovery Features:**
- Restarts on crash (max 10 restarts)
- Restarts if memory exceeds 500MB
- 4-second delay between restarts
- Timestamped logs in `./logs/`
- Min uptime 10s to count as successful start

---

## Railway Deployment

### Option 1: Deploy via GitHub

1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Add environment variables in Railway dashboard
4. Railway will auto-detect `railway.json` and deploy

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set STRIPE_SECRET_KEY=sk_live_xxx
railway variables set STRIPE_PUBLISHABLE_KEY=pk_live_xxx
railway variables set RESEND_API_KEY=re_xxx
railway variables set DATABASE_URL=postgresql://xxx
# ... add all other env vars

# Deploy
railway up
```

### Environment Variables for Railway

Add all variables from `backend/.env.example` to Railway dashboard:
- Update `API_BASE_URL` to your Railway domain
- Update `FRONTEND_URL` to your frontend URL
- Use **live** Stripe keys (not test keys)
- Configure Stripe webhook to point to Railway URL

### Stripe Webhooks on Railway

1. Get your Railway domain (e.g., `https://your-app.railway.app`)
2. Add webhook in Stripe Dashboard:
   - URL: `https://your-app.railway.app/api/stripe/webhook`
   - Events: `checkout.session.completed`
3. Copy webhook secret to Railway env vars

---

## Automation & Testing

The project includes automation scripts for validation, testing, monitoring, and deployment.

### Validate Environment

Check all required environment variables before starting:

```bash
node scripts/validate-env.js
```

This checks:
- Backend `.env` file exists and has valid API keys
- Frontend `.env` file exists
- PM2 is installed
- All required variables are set (not placeholders)
- Variables match expected format (Stripe keys, URLs, etc.)

**Validation runs automatically** when you use `./master-start.sh`

### Test All Endpoints

Test all 35+ backend endpoints:

```bash
# Test local backend
node scripts/test-endpoints.js

# Test remote backend (Railway, etc.)
node scripts/test-endpoints.js https://your-app.railway.app
```

Tests include:
- Health checks (`/health`, `/api/health`)
- Email test endpoint
- Stripe configuration
- Authentication endpoints
- Task endpoints

### Health Monitoring

Continuous health monitoring with automatic alerts:

```bash
node scripts/health-monitor.js
```

Features:
- Checks backend health every 30 seconds (configurable)
- Alerts after 3 consecutive failures (configurable)
- Logs alerts to `logs/health-alerts.log`
- Displays real-time status in terminal

**Environment variables:**
```bash
HEALTH_CHECK_INTERVAL=30000      # Check interval in ms (default: 30s)
HEALTH_ALERT_THRESHOLD=3         # Failures before alert (default: 3)
```

**Usage with PM2:**
```bash
# Add to ecosystem.config.js for background monitoring
pm2 start scripts/health-monitor.js --name health-monitor
```

### Automated Railway Deployment

Deploy to Railway with one command:

```bash
./scripts/deploy-railway.sh
```

This script:
1. Checks Railway CLI is installed
2. Validates environment variables
3. Prompts for confirmation
4. Sets all env vars from `backend/.env` to Railway
5. Deploys the application
6. Tests deployment health
7. Provides deployment URL and next steps

**Prerequisites:**
- Railway CLI installed: `npm install -g @railway/cli`
- Railway account (free tier available)
- backend/.env with production keys

### Automation Scripts Summary

All scripts located in `scripts/` directory:

| Script | Purpose | Usage |
|--------|---------|-------|
| `validate-env.js` | Check env vars | Auto-runs in master-start.sh |
| `test-endpoints.js` | Test all APIs | `node scripts/test-endpoints.js [URL]` |
| `health-monitor.js` | Monitor uptime | `node scripts/health-monitor.js` |
| `deploy-railway.sh` | Deploy to Railway | `./scripts/deploy-railway.sh` |

---

## Development

### Start Backend Only

```bash
cd backend
node server.full.js
# Or with PM2:
pm2 start ecosystem.config.js
```

### Start Frontend Only

```bash
npx expo start --tunnel
```

### Test Backend Endpoints

```bash
# Health check
curl http://localhost:5001/health

# Test email
curl http://localhost:5001/api/test-email

# Test contact form
curl -X POST http://localhost:5001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","message":"Test message"}'

# Get Stripe config
curl http://localhost:5001/api/stripe/config
```

---

## Stripe Integration

### Platform Fee Calculation

- **Task Payment**: 15% platform fee, 85% to worker
- **Extra Work**: 15% platform fee, 85% to worker
- **Tips**: 0% platform fee, 100% to worker

### Stripe Connect Flow

1. Worker clicks "Set up payouts"
2. Backend creates Stripe Connect account
3. Worker completes Stripe onboarding
4. Poster chooses worker and pays via Stripe Checkout
5. Platform fee deducted, remainder transferred to worker's account

### Testing Stripe Webhooks Locally

Use Stripe CLI:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# Or download from stripe.com/docs/stripe-cli

# Forward webhooks to local backend
stripe listen --forward-to http://localhost:5001/api/stripe/webhook

# Use the webhook secret shown in terminal
# Add to backend/.env: STRIPE_WEBHOOK_SECRET=whsec_xxx

# Test webhook
stripe trigger checkout.session.completed
```

---

## Email System

### Resend Integration

**Supported email types:**
- OTP verification codes
- Contact form submissions
- Generic transactional emails

**Email functions** (`backend/lib/resend.js`):
- `sendTestEmail(to)` - Test email
- `sendOTPEmail(to, code)` - Send OTP code
- `sendContactEmail(fromEmail, message, contactEmail)` - Contact form
- `sendEmail({to, subject, html, text, replyTo})` - Generic email

### Contact Form

Send contact form emails to `CONTACT_EMAIL`:

```bash
curl -X POST http://localhost:5001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "message": "I have a question about the platform"
  }'
```

Email is sent to address specified in `CONTACT_EMAIL` env var.

---

## Troubleshooting

### Backend won't start

```bash
# Check PM2 logs
pm2 logs fundedworker-backend --err

# Common issues:
# - Missing .env file: Copy from .env.example
# - Invalid API keys: Verify Stripe/Resend keys
# - Port in use: Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### Expo tunnel fails

```bash
# Use LAN mode instead
npx expo start --lan

# Or localhost (device must be on same network)
npx expo start
```

### Stripe payments not working

```bash
# Verify Stripe config
curl http://localhost:5001/api/stripe/config

# Check webhook secret is set
grep STRIPE_WEBHOOK_SECRET backend/.env

# Test with Stripe CLI
stripe listen --forward-to http://localhost:5001/api/stripe/webhook
```

### Email not sending

```bash
# Test Resend integration
curl http://localhost:5001/api/test-email?to=your-email@example.com

# Check Resend API key
grep RESEND_API_KEY backend/.env
```

### Database connection errors

```bash
# Verify DATABASE_URL in backend/.env
# Ensure PostgreSQL is running
# Check connection with psql:
psql $DATABASE_URL
```

---

## License

MIT

---

## Support

For questions or issues:
- Contact: citytask@outlook.com (or your CONTACT_EMAIL)
- GitHub Issues: [Your Repo URL]
