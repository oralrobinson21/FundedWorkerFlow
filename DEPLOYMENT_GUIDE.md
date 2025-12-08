# FundedWorkerFlow Deployment Guide

Complete step-by-step guide to deploy your full-stack app to Railway and get it running at 100%.

---

## Prerequisites

- [x] GitHub repository with FundedWorkerFlow code
- [x] Railway account (https://railway.app)
- [x] Stripe account in test mode (https://stripe.com)
- [x] Resend account for emails (https://resend.com) - optional
- [x] All environment variable values from platform shared variables

---

## Part 1: Backend Deployment to Railway

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authenticate with GitHub and select your repository
5. Railway will create a new project

### Step 2: Configure Backend Service

1. In Railway project dashboard, click on the service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Build Command**: (leave default or `npm install`)
5. Set **Start Command**: `node server.js`
6. Click **"Save Changes"**

### Step 3: Add PostgreSQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will provision a Postgres database
4. Go to PostgreSQL service → **Variables** tab
5. Copy the `DATABASE_URL` value (you'll need this next)

### Step 4: Configure Backend Environment Variables

Go to your backend service → **Variables** tab and add these:

**Required Variables:**
```bash
# Copy from your platform shared variables (screenshots)
STRIPE_SECRET_KEY=sk_test_51QUC9wP5... (your actual key)
STRIPE_PUBLISHABLE_KEY=pk_test_51QUC9wP5... (your actual key)
STRIPE_CONNECT_CLIENT_ID=ca_RlSA... (your actual ID)
STRIPE_WEBHOOK_SECRET=whsec_... (create webhook first - Step 6)

# Database - copy from Railway Postgres addon
DATABASE_URL=postgresql://postgres:PASSWORD@HOST:5432/railway

# Platform settings
PLATFORM_FEE_PERCENT=15
MIN_JOB_PRICE_USD=7

# URLs - get after deployment
FRONTEND_URL=https://your-frontend-url.railway.app
API_BASE_URL=https://your-backend-url.railway.app
BACKEND_PORT=5001

# Email (optional - won't crash without it)
RESEND_API_KEY=re_YOUR_KEY
CONTACT_EMAIL=citytask@outlook.com

# Supabase (optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**Important:** Replace all `your-actual-*` placeholders with real values!

### Step 5: Deploy Backend

1. Click **"Deploy"** button (or it auto-deploys)
2. Watch the deployment logs
3. Look for success messages:
   ```
   Database tables initialized
   ✅ Backend running on http://0.0.0.0:5001
   Minimum job price: $7
   Platform fee: 15%
   ```
4. Copy your backend URL from Railway (e.g., `fundedworkerflow-backend-production.up.railway.app`)

### Step 6: Configure Stripe Webhooks

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://your-backend-url.railway.app/api/stripe/webhook`
4. Click **"Select events"** → Choose:
   - `checkout.session.completed`
5. Click **"Add endpoint"**
6. Click on the endpoint → **"Signing secret"** → **"Reveal"**
7. Copy the `whsec_...` value
8. Go back to Railway → Backend service → Variables
9. Update `STRIPE_WEBHOOK_SECRET` with the webhook signing secret
10. Save and redeploy backend

### Step 7: Test Backend

Open in browser:
```
https://your-backend-url.railway.app/health
```

Expected response:
```json
{"status":"ok"}
```

Also test:
```
https://your-backend-url.railway.app/api/health
```

Expected:
```json
{"status":"ok","timestamp":"2025-12-08T..."}
```

---

## Part 2: Frontend Deployment

### Option A: Expo Go (Quick Testing)

**Best for:** Development and quick testing on your phone

1. Install Expo Go app on your phone (iOS/Android)

2. Update frontend `.env` file:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

3. Start Expo dev server:
   ```bash
   cd FundedWorkerFlow
   npx expo start
   ```

4. Scan QR code with Expo Go app

5. Test authentication and features

### Option B: Railway Web Deployment

**Best for:** Web version accessible via browser

1. In Railway project, click **"+ New"** → **"Empty Service"**

2. Link to same GitHub repository

3. Configure service settings:
   - **Root Directory:** `.` (root of repo)
   - **Build Command:** `npx expo export -p web`
   - **Start Command:** `npx serve web-build -l 3000`

4. Add environment variables:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co (optional)
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key (optional)
   ```

5. Deploy and get frontend URL

### Option C: Expo EAS (Production Mobile Apps)

**Best for:** Production app store deployment

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS project:
   ```bash
   cd FundedWorkerFlow
   eas build:configure
   ```

4. Update `eas.json` with environment variables:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_API_URL": "https://your-backend-url.railway.app"
         }
       }
     }
   }
   ```

5. Build for iOS and/or Android:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

6. Submit to app stores:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

---

## Part 3: Environment Variables Checklist

### Backend Railway Variables ✅

Copy from your platform shared variables:

- [ ] `STRIPE_SECRET_KEY` (from Stripe Dashboard → API keys)
- [ ] `STRIPE_PUBLISHABLE_KEY` (from Stripe Dashboard)
- [ ] `STRIPE_CONNECT_CLIENT_ID` (from Stripe Connect settings)
- [ ] `STRIPE_WEBHOOK_SECRET` (from Stripe Webhooks after creating endpoint)
- [ ] `DATABASE_URL` (from Railway Postgres addon)
- [ ] `RESEND_API_KEY` (optional - from Resend dashboard)
- [ ] `FRONTEND_URL` (your frontend deployment URL)
- [ ] `API_BASE_URL` (your backend Railway URL)
- [ ] `PLATFORM_FEE_PERCENT=15`
- [ ] `MIN_JOB_PRICE_USD=7`
- [ ] `BACKEND_PORT=5001`
- [ ] `CONTACT_EMAIL=citytask@outlook.com`

### Frontend Variables ✅

- [ ] `EXPO_PUBLIC_API_URL` (backend Railway URL - NO trailing slash)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` (optional)
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` (optional)

---

## Part 4: Verification Steps

### 1. Backend Health Check
```bash
curl https://your-backend-url.railway.app/health
```
✅ Should return: `{"status":"ok"}`

### 2. Stripe Config Check
```bash
curl https://your-backend-url.railway.app/api/stripe/config
```
✅ Should return: `{"publishableKey":"pk_test_..."}`

### 3. Database Check

Go to Railway → PostgreSQL service → **Data** tab → Query:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```
✅ Should show: `users`, `otp_codes`, `tasks`, `offers`, `chat_threads`, `chat_messages`, `activity_logs`, `extra_work_requests`, `disputes`

### 4. Frontend Connection Test

1. Open app (Expo Go or web)
2. Navigate to login screen
3. Enter email → Click "Continue"
4. Check Railway backend logs:
   ```
   [DEV] OTP Code for your-email@example.com: 123456
   ```
5. Enter OTP code
6. ✅ Should navigate to home screen

---

## Part 5: Complete Test Flow

### Test 1: User Registration
- [ ] Open app, enter email
- [ ] Receive OTP (check Railway logs)
- [ ] Enter OTP code
- [ ] User created, navigates to home

### Test 2: Task Creation
- [ ] Switch to "Poster" mode
- [ ] Create task (title, description, price, category)
- [ ] Task appears in "My Tasks"
- [ ] Check Railway logs: `[LOG] task_created`

### Test 3: Offer Submission
- [ ] Login as different user (helper)
- [ ] Browse tasks, open one
- [ ] Submit offer with note
- [ ] Check Railway logs: `[LOG] offer_submitted`

### Test 4: Payment Flow
- [ ] Login as poster
- [ ] Choose helper from offers
- [ ] Redirects to Stripe Checkout
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Webhook fires, task status = "accepted"
- [ ] Chat created
- [ ] Check Railway logs: `Job {taskId} accepted, payment confirmed`

### Test 5: Chat
- [ ] Open accepted task
- [ ] Send message
- [ ] Message appears in chat

### Test 6: Task Completion
- [ ] Helper marks task complete
- [ ] Task status changes to "completed"

---

## Common Issues & Solutions

### Backend won't start
**Error:** `Missing API key. Pass it to the constructor new Resend`
**Solution:** This should be fixed by the Resend lazy initialization. Redeploy backend.

### Database connection fails
**Error:** `ECONNREFUSED` or `database "fundedworkerflow" does not exist`
**Solution:**
1. Verify `DATABASE_URL` is set correctly in Railway
2. Copy from PostgreSQL addon variables
3. Format: `postgresql://postgres:password@host:5432/railway`

### Frontend can't connect to backend
**Error:** Network request failed
**Solution:**
1. Check `EXPO_PUBLIC_API_URL` is correct
2. Remove trailing slashes from URL
3. Test backend health endpoint in browser
4. Check CORS is enabled (already configured in server.js)

### Stripe checkout not working
**Error:** Stripe error 400 or 500
**Solution:**
1. Verify all Stripe keys are correct (test mode)
2. Check user has Stripe Connect account set up
3. Verify webhook endpoint is correct
4. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-backend.railway.app/api/stripe/webhook
   ```

### OTP email not sending
**Note:** This is expected if `RESEND_API_KEY` not configured
**Solution:**
1. Check Railway logs for: `[DEV] OTP Code for email: 123456`
2. Use code from logs to login
3. To enable emails: Add valid `RESEND_API_KEY` in Railway variables

---

## Production Deployment Checklist

Before going live:

- [ ] Switch Stripe to **live mode** keys
- [ ] Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` with live keys
- [ ] Update Stripe webhook endpoint to use live mode
- [ ] Add production domain to `FRONTEND_URL`
- [ ] Enable `RESEND_API_KEY` for email sending
- [ ] Review and set appropriate `PLATFORM_FEE_PERCENT`
- [ ] Review and set appropriate `MIN_JOB_PRICE_USD`
- [ ] Enable Railway production database backups
- [ ] Set up monitoring and error tracking
- [ ] Configure custom domain (optional)
- [ ] Test complete user flow in production
- [ ] Review Stripe Connect onboarding flow
- [ ] Set up customer support email

---

## Getting Help

**Railway Logs:**
- Go to Railway service → **Deployments** tab → Click latest deployment → View logs

**Stripe Logs:**
- https://dashboard.stripe.com/test/logs

**Common Log Locations:**
- Backend errors: Railway backend service logs
- Database errors: Railway PostgreSQL service logs
- Webhook errors: Stripe dashboard → Webhooks → Click endpoint → Recent deliveries

---

## Success Indicators

✅ Backend Railway logs show: `Database tables initialized` and `✅ Backend running`
✅ `/health` endpoint returns `{"status":"ok"}`
✅ Frontend connects and shows login screen
✅ OTP codes appear in Railway logs
✅ Users can login and navigate app
✅ Tasks can be created and appear in list
✅ Offers can be submitted
✅ Stripe checkout opens successfully
✅ Webhooks are received and processed
✅ Chat messages send successfully
✅ No errors in Railway logs during normal operation

When all above are true: **Your app is running at 100%** 🎉

---

**Last Updated:** 2025-12-08
**Version:** 1.0
