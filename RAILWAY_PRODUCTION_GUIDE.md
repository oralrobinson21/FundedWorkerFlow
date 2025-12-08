# Railway Production Deployment Guide - citytask.app

Complete guide to deploying FundedWorkerFlow to Railway with custom domain, SSL, and Stripe integration.

---

## Table of Contents
1. [Current Status & Issues](#current-status--issues)
2. [Architecture Overview](#architecture-overview)
3. [Railway Configuration](#railway-configuration)
4. [DNS & SSL Setup](#dns--ssl-setup)
5. [Environment Variables](#environment-variables)
6. [Stripe Integration](#stripe-integration)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

---

## Current Status & Issues

### ✅ What's Fixed
- **Backend server routing**: Added root route handler (no more "Cannot GET /")
- **PORT configuration**: Now uses Railway's PORT env variable correctly
- **Static file serving**: Backend can serve frontend build if available

### 🔧 What Needs Attention
- **DNS Configuration**: Ensure CNAME/ALIAS records point correctly to Railway
- **SSL Certificate**: Wait for Railway SSL validation (can take up to 24 hours)
- **Environment Variables**: Verify all required variables are set in Railway dashboard
- **Stripe Webhooks**: Update webhook endpoint URL to citytask.app domain

---

## Architecture Overview

### Current Setup
```
citytask.app (Custom Domain)
    ↓
Railway Project: FundedWorkerFlow
    ↓
Single Service: Backend Express Server
    ├─ API Routes: /api/*
    ├─ Health Check: /health, /api/health
    ├─ Root Route: / (landing page)
    └─ Static Files: /web-build/* (if exists)
```

### Recommended Production Architecture

**Option A: Single Service (Current - Simpler)**
```
citytask.app → Railway Backend (Port 5001)
├─ Serves API on /api/*
├─ Serves landing page on /
└─ Can serve static frontend build
```

**Option B: Separate Services (Better for Scale)**
```
api.citytask.app → Railway Backend Service
citytask.app → Railway Frontend Service (Expo Web Build)
```

For now, we're using **Option A** since your backend is already configured.

---

## Railway Configuration

### Step 1: Verify Service Settings

Go to Railway Dashboard → Your Project → Backend Service → **Settings**

**Service Configuration:**
```
Root Directory: backend/
Build Command: (leave empty - npm install runs automatically)
Start Command: node server.js
```

**Port Configuration:**
- Railway automatically sets `PORT` environment variable
- Your server now uses: `process.env.PORT || 5001`
- ✅ This is correct - no changes needed

### Step 2: Check Deployment Logs

Railway Dashboard → Deployments → Latest Deployment → **View Logs**

**Look for these success messages:**
```
Database tables initialized
✅ Backend running on http://0.0.0.0:5001
Minimum job price: $7
Platform fee: 15%
```

**If you see errors:**
- Check environment variables are set (next section)
- Verify DATABASE_URL is correct
- Check Stripe keys are valid

---

## DNS & SSL Setup

### Current DNS Configuration

Based on your setup with citytask.app pointing to Railway:

**Required DNS Records:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | fundedworkerflow-production.up.railway.app | 300 |
| ALIAS/ANAME | @ | fundedworkerflow-production.up.railway.app | 300 |

*Note: Replace `fundedworkerflow-production.up.railway.app` with your actual Railway service URL*

### Step-by-Step DNS Setup

1. **Get Your Railway Domain**
   - Go to Railway → Your Service → **Settings**
   - Under "Domains", find your Railway-provided domain
   - Format: `your-service-name-production.up.railway.app`
   - Copy this domain

2. **Configure DNS (at your domain registrar)**

   **For Root Domain (@):**
   - If registrar supports ALIAS/ANAME: Use ALIAS pointing to Railway domain
   - If only supports A records: Use Railway's IP (not recommended - can change)
   - **Best**: Use CNAME flattening if available

   **For WWW Subdomain:**
   - Type: CNAME
   - Name: `www`
   - Value: `your-service-production.up.railway.app`
   - TTL: 300 (5 minutes)

3. **Add Domain to Railway**
   - Railway → Service → Settings → **Domains**
   - Click "+ Custom Domain"
   - Enter: `citytask.app`
   - Click "Add"
   - Railway will show DNS instructions
   - Repeat for `www.citytask.app`

### SSL Certificate Setup

**Automatic SSL (Railway):**
- Railway automatically provisions SSL certificates via Let's Encrypt
- This happens AFTER DNS is correctly configured
- Can take **5 minutes to 24 hours**

**Check SSL Status:**
```bash
# Test SSL certificate
curl -I https://citytask.app

# Should return 200 OK with valid HTTPS
```

**If SSL not working:**
1. Verify DNS is propagated: `dig citytask.app`
2. Wait 24 hours for initial SSL issuance
3. Check Railway dashboard for SSL status
4. Ensure both domains (root and www) are added to Railway

**Troubleshooting SSL:**
- "Your connection is not private" = SSL not issued yet (wait)
- "This site can't be reached" = DNS not configured correctly
- "NET::ERR_CERT_COMMON_NAME_INVALID" = Domain not added to Railway

---

## Environment Variables

### Required Variables for Production

Go to Railway → Service → **Variables** tab

**Critical Variables:**

```bash
# Railway automatically sets
PORT=5001  # ← Railway will override this

# Database (from Railway Postgres addon)
DATABASE_URL=postgresql://postgres:password@host:5432/database

# Stripe Keys (LIVE MODE for production)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_CLIENT_ID
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET

# Platform Configuration
PLATFORM_FEE_PERCENT=15
MIN_JOB_PRICE_USD=7

# Frontend URL (your domain)
FRONTEND_URL=https://citytask.app
API_BASE_URL=https://citytask.app

# Email Service (Resend)
RESEND_API_KEY=re_YOUR_API_KEY
CONTACT_EMAIL=citytask@outlook.com

# Supabase (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

### Test vs Live Mode

Your app should use **LIVE MODE** in production:

**Test Mode (for development):**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Live Mode (for production):**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**How to Switch:**
1. Get Live keys from Stripe Dashboard (toggle from Test to Live mode)
2. Update environment variables in Railway
3. Update webhook endpoint with live webhook secret
4. Redeploy service

**IMPORTANT:** Live mode processes real payments. Test mode does not.

---

## Stripe Integration

### Step 1: Switch to Live Mode

1. Go to https://dashboard.stripe.com
2. Toggle from "Test mode" to "Live mode" (top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (pk_live_...)
   - **Secret key** (sk_live_...) - Click "Reveal" first

### Step 2: Configure Stripe Connect

1. Still in Live mode, go to **Connect** → **Settings**
2. Copy **Client ID** (ca_...)
3. Set `STRIPE_CONNECT_CLIENT_ID` in Railway

### Step 3: Configure Webhooks (CRITICAL)

**For Production (Live Mode):**

1. Stripe Dashboard (Live mode) → **Developers** → **Webhooks**
2. Click "+ Add endpoint"
3. **Endpoint URL:** `https://citytask.app/api/stripe/webhook`
   ⚠️ Use your actual domain, not Railway domain
4. **Events to send:**
   - Select `checkout.session.completed`
5. Click "Add endpoint"
6. Click on the endpoint → **Signing secret** → **Reveal**
7. Copy `whsec_...` value
8. Set `STRIPE_WEBHOOK_SECRET` in Railway
9. Redeploy

**Verify Webhook:**
```bash
# Test webhook endpoint
curl https://citytask.app/api/stripe/webhook

# Should return Webhook Error (signature missing) - that's correct!
# Means endpoint is reachable
```

**Test Webhook Deliveries:**
- Go to Stripe Dashboard → Webhooks → Your endpoint
- Click "Send test webhook"
- Select `checkout.session.completed`
- Check Railway logs for webhook processing

### Step 4: Stripe Connect Account Link URLs

Update these in your environment (Railway):

```bash
FRONTEND_URL=https://citytask.app
```

The backend uses this for:
- Stripe Connect onboarding return URLs
- Stripe Checkout success/cancel URLs

Verify these endpoints work:
- `https://citytask.app/payouts/onboarding/complete`
- `https://citytask.app/payouts/onboarding/refresh`
- `https://citytask.app/payment/success`
- `https://citytask.app/payment/cancel`

---

## Testing & Verification

### 1. Test Backend API

```bash
# Health check
curl https://citytask.app/health
# Expected: {"status":"ok"}

# API health check
curl https://citytask.app/api/health
# Expected: {"status":"ok","timestamp":"..."}

# Stripe config
curl https://citytask.app/api/stripe/config
# Expected: {"publishableKey":"pk_live_..."}
```

### 2. Test Frontend (Root)

Visit: https://citytask.app

Should show: Beautiful landing page with API info (not "Cannot GET /")

### 3. Test OTP Authentication

```bash
curl -X POST https://citytask.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@citytask.app","name":"Test User","role":"both"}'

# Expected: {"success":true,"message":"OTP sent"}
# Check Railway logs for OTP code
```

### 4. Test Database Connection

Check Railway logs for:
```
Database tables initialized
```

If missing: DATABASE_URL is incorrect or database not accessible

### 5. Test Stripe Payment Flow

1. Create a test account (use real email in live mode)
2. Post a task
3. Submit an offer as helper
4. Choose helper as poster
5. Should redirect to Stripe Checkout (live mode)
6. Complete payment with real card (or test card if still in test mode)
7. Check Railway logs for webhook:
   ```
   [WEBHOOK] checkout.session.completed
   Job {taskId} accepted, payment confirmed
   ```

---

## Troubleshooting

### Issue: Domain not resolving

**Symptoms:**
- "This site can't be reached"
- DNS_PROBE_FINISHED_NXDOMAIN

**Solutions:**
1. Check DNS records are correct:
   ```bash
   dig citytask.app
   dig www.citytask.app
   ```
2. Wait for DNS propagation (5 minutes to 48 hours)
3. Verify domain added to Railway settings
4. Try different DNS server: `dig @8.8.8.8 citytask.app`

### Issue: SSL Certificate Error

**Symptoms:**
- "Your connection is not private"
- NET::ERR_CERT_AUTHORITY_INVALID

**Solutions:**
1. Wait up to 24 hours for initial SSL certificate issuance
2. Verify DNS is correct (SSL won't issue if DNS wrong)
3. Check Railway dashboard → Domains → SSL status
4. Force HTTPS redirect in your domain settings
5. Clear browser cache and try in incognito mode

### Issue: "Cannot GET /" Error

**Fixed in latest update!** But if you still see it:

1. Verify you're running latest code (with root route handler)
2. Check Railway logs - server should start successfully
3. Redeploy service in Railway
4. Clear CDN/proxy cache if using Cloudflare

### Issue: Stripe Webhook Not Firing

**Symptoms:**
- Payments complete but task status doesn't change
- No webhook logs in Railway

**Solutions:**
1. **Check webhook URL is correct:**
   - Must use custom domain: `https://citytask.app/api/stripe/webhook`
   - NOT Railway domain
2. **Verify webhook secret matches:**
   - Get from Stripe Dashboard → Webhooks → Signing secret
   - Update `STRIPE_WEBHOOK_SECRET` in Railway
3. **Check webhook deliveries in Stripe:**
   - Dashboard → Webhooks → Your endpoint → Recent deliveries
   - Look for failed attempts (red X)
   - Click to see error details
4. **Test webhook manually:**
   ```bash
   # From Stripe Dashboard, click "Send test webhook"
   # Check Railway logs immediately
   ```

### Issue: Database Connection Errors

**Symptoms:**
```
❌ Failed to start server: Error: ECONNREFUSED
```

**Solutions:**
1. Check `DATABASE_URL` is set in Railway variables
2. Verify format: `postgresql://user:pass@host:5432/database`
3. If using Railway Postgres addon:
   - Go to Postgres service → Variables
   - Copy DATABASE_URL
   - Paste in backend service variables
4. Check database service is running (not crashed)

### Issue: Port Binding Errors

**Symptoms:**
```
Error: listen EADDRINUSE :::5001
```

**Solutions:**
1. ✅ Already fixed - server now uses `process.env.PORT`
2. Verify no other services using same port
3. Railway automatically assigns port - don't hardcode PORT=5001
4. Redeploy service

### Issue: Environment Variables Not Loading

**Symptoms:**
- Stripe errors mentioning missing API key
- Database connection fails
- App behavior differs from local

**Solutions:**
1. Go to Railway → Service → **Variables** tab
2. Verify ALL required variables are listed
3. Click "Deploy" or "Redeploy" after adding variables
4. Check for typos in variable names (case sensitive!)
5. Don't use quotes around values in Railway UI

---

## Production Checklist

Before going live with real users:

### Security
- [ ] Using Stripe LIVE mode keys (not test)
- [ ] SSL certificate active and valid
- [ ] Database has strong password
- [ ] RESEND_API_KEY configured for email sending
- [ ] CORS configured correctly (allows your domain)
- [ ] Webhook signature validation working

### Stripe
- [ ] Live mode enabled in Stripe Dashboard
- [ ] Stripe Connect client ID updated
- [ ] Webhook endpoint using custom domain (citytask.app)
- [ ] Webhook secret is LIVE webhook secret
- [ ] Test payment completed successfully in live mode
- [ ] Platform fee percentage configured correctly

### Infrastructure
- [ ] DNS propagated and resolving correctly
- [ ] Both citytask.app and www.citytask.app working
- [ ] HTTPS working on both domains
- [ ] Database initialized with all tables
- [ ] Railway Postgres backup configured
- [ ] Monitoring/alerting set up (optional)

### Testing
- [ ] Can register new user with OTP
- [ ] Can create task
- [ ] Can submit offer
- [ ] Can complete payment via Stripe
- [ ] Webhook processes payment correctly
- [ ] Chat works
- [ ] Task completion works
- [ ] Stripe Connect onboarding works

### Compliance & Legal
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Payment processing disclosures
- [ ] Stripe compliance requirements met
- [ ] Platform fee clearly disclosed to users

---

## Monitoring & Maintenance

### Railway Logs

**View logs:**
```
Railway Dashboard → Service → Deployments → Latest → View Logs
```

**Key things to monitor:**
- Webhook processing (look for `[WEBHOOK]`)
- Database queries taking >1000ms
- Error messages (look for `❌` or `Error:`)
- OTP codes (in development - `[DEV] OTP Code`)

**Set up log alerts (optional):**
- Use Railway's integrations
- Connect to external logging service (Datadog, Sentry, etc.)

### Stripe Dashboard Monitoring

**Check regularly:**
- Payments: https://dashboard.stripe.com/payments
- Connect accounts: https://dashboard.stripe.com/connect/accounts
- Webhooks: https://dashboard.stripe.com/webhooks
- Disputes/chargebacks

**Set up notifications:**
- Stripe Dashboard → Settings → Notifications
- Enable email alerts for failed payments, disputes, etc.

### Database Maintenance

**Railway Postgres:**
- Backups run automatically
- Can restore from Railway dashboard
- Monitor disk usage in Railway metrics

**Recommended:**
- Regular database backups (beyond Railway's)
- Monitor connection pool usage
- Index frequently queried columns

---

## Quick Reference

### Important URLs

**Production:**
- Frontend: https://citytask.app
- API: https://citytask.app/api/
- Health: https://citytask.app/health
- Stripe Config: https://citytask.app/api/stripe/config

**Admin Dashboards:**
- Railway: https://railway.app/project/your-project-id
- Stripe: https://dashboard.stripe.com
- Domain DNS: (your registrar's dashboard)

### Support Resources

- Railway Support: https://help.railway.app/
- Stripe Support: https://support.stripe.com/
- Stripe API Docs: https://stripe.com/docs/api

### Emergency Contacts

If your app goes down:

1. Check Railway status page: https://railway.statuspage.io/
2. View Railway logs for errors
3. Check Stripe webhook deliveries
4. Verify DNS still resolving
5. Check database connection
6. Restart service in Railway if needed

---

**Last Updated:** 2025-12-08
**Version:** 1.0
**Status:** Production Ready ✅
