# FundedWorkerFlow Troubleshooting Guide

Complete guide to diagnosing and fixing common issues with your FundedWorkerFlow app.

---

## Table of Contents
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)
- [Stripe/Payment Issues](#stripepayment-issues)
- [Email Issues](#email-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)

---

## Backend Issues

### Issue: Backend crashes on startup

**Symptom:**
```
❌ Failed to start server: Error: Missing API key
```

**Cause:** Resend client trying to initialize without API key

**Solution:**
1. This should be fixed by the lazy initialization pattern
2. Verify `/backend/lib/resend.js` has `getResendClient()` function
3. Redeploy backend
4. Check Railway logs - should see warning instead of crash:
   ```
   ⚠️  RESEND_API_KEY not configured - email sending disabled
   ```

**Verification:**
```bash
curl https://your-backend-url.railway.app/health
# Should return: {"status":"ok"}
```

---

### Issue: Database tables not created

**Symptom:**
```
Error: relation "users" does not exist
```

**Cause:** Database initialization not running or DATABASE_URL invalid

**Solution:**
1. Check Railway logs for:
   ```
   Database tables initialized
   ```
2. If missing, verify `server.js` line 1214 has:
   ```javascript
   await initDatabase();
   ```
   (Not commented out)
3. Verify `DATABASE_URL` in Railway environment variables
4. Correct format: `postgresql://user:pass@host:5432/dbname`
5. Redeploy backend

**Manual table creation (if needed):**
Connect to Railway PostgreSQL and run:
```sql
-- Copy SQL from backend/db.js initDatabase() function
-- Creates all required tables
```

---

### Issue: Backend 500 errors

**Symptom:**
API endpoints return `{"success":false,"error":"Internal server error"}`

**Diagnosis:**
1. Check Railway backend logs for stack traces
2. Look for specific error messages
3. Common causes:
   - Missing environment variables
   - Database connection issues
   - Invalid Stripe keys
   - Missing user authentication (x-user-id header)

**Solutions by error type:**

**"Cannot read property of undefined"**
- Check all required environment variables are set
- Verify request includes required fields

**"ECONNREFUSED"**
- Database connection issue
- Verify DATABASE_URL is correct
- Check Railway Postgres service is running

**"Invalid API key"**
- Stripe key is wrong or missing
- Verify STRIPE_SECRET_KEY in Railway variables
- Must start with `sk_test_` (test mode) or `sk_live_` (production)

---

### Issue: CORS errors in browser

**Symptom:**
```
Access to fetch has been blocked by CORS policy
```

**Cause:** Frontend domain not allowed by backend CORS

**Solution:**
CORS should already be configured in `server.js`:
```javascript
app.use(cors({
  origin: '*',
  credentials: true
}));
```

If still having issues:
1. Check FRONTEND_URL environment variable
2. Update CORS origin to specific domain:
   ```javascript
   origin: process.env.FRONTEND_URL || '*'
   ```
3. Redeploy backend

---

### Issue: Webhook signature verification failed

**Symptom:**
```
Error: Webhook signature verification failed
```

**Cause:** Stripe webhook secret doesn't match

**Solution:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Signing secret" → "Reveal"
4. Copy the `whsec_...` value
5. Update STRIPE_WEBHOOK_SECRET in Railway
6. Redeploy backend

**Test webhook locally:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to http://localhost:5001/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## Frontend Issues

### Issue: Frontend can't connect to backend

**Symptom:**
```
Network request failed
TypeError: Network request failed
```

**Cause:** EXPO_PUBLIC_API_URL not set or incorrect

**Solution:**
1. Check `FundedWorkerFlow/.env` file exists
2. Verify EXPO_PUBLIC_API_URL is set correctly:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```
3. **NO trailing slash** on URL
4. Restart Expo dev server:
   ```bash
   # Kill current server (Ctrl+C)
   npx expo start --clear
   ```
5. Test backend URL in browser first:
   ```
   https://your-backend-url.railway.app/health
   ```

**Check what API URL is being used:**
Add console.log in `utils/api.ts`:
```typescript
console.log('API_BASE_URL:', API_BASE_URL);
```

---

### Issue: App shows blank screen

**Symptom:**
White/blank screen when opening app

**Cause:** JavaScript error during render

**Solution:**
1. Check Expo dev tools console for errors
2. Common causes:
   - Missing environment variables
   - Undefined variables in components
   - Failed API calls on mount
3. Open React Native debugger
4. Look for red error screens
5. Check AppContext initialization in `context/AppContext.tsx`

**Test in browser (web version):**
```bash
npx expo start --web
```
Check browser console for specific errors

---

### Issue: OTP code not appearing

**Symptom:**
User enters email, but no OTP code received

**Cause:** Email service not configured (expected in development)

**Solution:**
1. **Development mode:** Check Railway backend logs
   ```
   [DEV] OTP Code for email@example.com: 123456
   ```
2. Use the code from logs to verify
3. **Production mode:** Configure RESEND_API_KEY
   - Get API key from https://resend.com/api-keys
   - Add to Railway environment variables
   - Redeploy backend

**Test OTP sending:**
```bash
curl -X POST https://your-backend-url.railway.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","role":"both"}'
```

---

### Issue: Images not uploading

**Symptom:**
Profile photos or task photos fail to upload

**Cause:** Image upload endpoint or file size issues

**Solution:**
1. Check backend logs for upload errors
2. Verify image size (backend likely has limits)
3. Check Content-Type header is set correctly
4. Test with smaller image first
5. Verify user has camera/photo permissions on device

**Backend endpoints:**
- Profile photo: `PUT /api/users/:userId/photo`
- Task photo: `POST /api/tasks` (as base64 in body)

---

### Issue: Navigation not working

**Symptom:**
Clicking buttons doesn't navigate between screens

**Cause:** Expo Router configuration or navigation issues

**Solution:**
1. Check `app/` directory structure matches routes
2. Verify `expo-router` is installed:
   ```bash
   npm install expo-router
   ```
3. Check `app.json` or `app.config.js` for router config
4. Clear Expo cache:
   ```bash
   npx expo start --clear
   ```
5. Check for navigation errors in console

---

## Database Issues

### Issue: Cannot connect to database

**Symptom:**
```
Error: ECONNREFUSED
Error: password authentication failed
```

**Cause:** DATABASE_URL is incorrect or database not accessible

**Solution:**
1. **Railway Postgres addon:**
   - Go to Railway → PostgreSQL service
   - Click "Variables" tab
   - Copy DATABASE_URL value
   - Paste into backend service variables
   - Format: `postgresql://postgres:PASSWORD@HOST:PORT/railway`

2. **Test connection:**
   ```bash
   # Install PostgreSQL client
   psql "postgresql://postgres:PASSWORD@HOST:PORT/railway"
   ```

3. **Check database is running:**
   - Railway → PostgreSQL service should show "Active"
   - Check service logs for errors

---

### Issue: Duplicate key errors

**Symptom:**
```
Error: duplicate key value violates unique constraint
```

**Cause:** Trying to insert data that already exists (email, ID, etc.)

**Solution:**
1. **Check for existing data:**
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```
2. **Update instead of insert:**
   - Use `ON CONFLICT` in SQL queries
   - Check backend code for proper upsert logic
3. **Clean up test data:**
   ```sql
   DELETE FROM users WHERE email LIKE 'test%@example.com';
   ```

---

### Issue: Foreign key constraint violations

**Symptom:**
```
Error: insert or update violates foreign key constraint
```

**Cause:** Referenced record doesn't exist (e.g., task_id doesn't exist in tasks table)

**Solution:**
1. **Check referenced record exists:**
   ```sql
   SELECT * FROM tasks WHERE id = 'TASK_ID';
   ```
2. **Common scenarios:**
   - Offer references non-existent task
   - Chat references non-existent user
   - Dispute references non-existent task
3. **Fix by creating parent record first**
4. **Check cascade delete settings** in schema

---

### Issue: Slow database queries

**Symptom:**
API endpoints taking > 2 seconds to respond

**Cause:** Missing indexes or inefficient queries

**Solution:**
1. **Check Railway logs for slow queries**
2. **Add indexes on frequently queried columns:**
   ```sql
   CREATE INDEX idx_tasks_poster_id ON tasks(poster_id);
   CREATE INDEX idx_tasks_status ON tasks(status);
   CREATE INDEX idx_offers_task_id ON offers(task_id);
   CREATE INDEX idx_chat_messages_thread_id ON chat_messages(thread_id);
   ```
3. **Analyze query performance:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'pending';
   ```
4. **Check connection pool settings** in `db.js`

---

## Stripe/Payment Issues

### Issue: Stripe checkout not opening

**Symptom:**
Choose helper button clicked, but no redirect to Stripe

**Cause:** Stripe keys not configured or session creation failed

**Solution:**
1. **Check backend logs** for errors:
   ```
   Error creating Stripe checkout session
   ```
2. **Verify Stripe keys in Railway:**
   - STRIPE_SECRET_KEY (starts with `sk_test_`)
   - STRIPE_PUBLISHABLE_KEY (starts with `pk_test_`)
   - STRIPE_CONNECT_CLIENT_ID (starts with `ca_`)
3. **Test Stripe config endpoint:**
   ```bash
   curl https://your-backend-url.railway.app/api/stripe/config
   ```
4. **Verify helper has Stripe Connect set up:**
   ```sql
   SELECT stripe_account_id FROM users WHERE id = 'HELPER_ID';
   ```
   Should not be NULL

---

### Issue: Payment succeeds but task not updated

**Symptom:**
Payment completes in Stripe, but task status stays "pending"

**Cause:** Webhook not firing or failing

**Solution:**
1. **Check Stripe webhook configured:**
   - Go to Stripe Dashboard → Webhooks
   - Endpoint should be: `https://your-backend.railway.app/api/stripe/webhook`
   - Event should be: `checkout.session.completed`

2. **Check webhook deliveries:**
   - Stripe Dashboard → Webhooks → Click endpoint
   - View "Recent deliveries"
   - Look for failed deliveries (red X)
   - Click failed delivery to see error

3. **Check backend logs for webhook:**
   ```
   [WEBHOOK] checkout.session.completed
   Job {taskId} accepted, payment confirmed
   ```

4. **Verify webhook secret:**
   - Must match signing secret from Stripe dashboard
   - Update STRIPE_WEBHOOK_SECRET in Railway
   - Redeploy

5. **Test webhook manually:**
   ```bash
   stripe listen --forward-to https://your-backend.railway.app/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

---

### Issue: Stripe Connect onboarding fails

**Symptom:**
Helper clicks "Setup Payouts" but gets error or blank page

**Cause:** Stripe Connect not configured correctly

**Solution:**
1. **Verify STRIPE_CONNECT_CLIENT_ID:**
   - Get from Stripe Dashboard → Connect → Settings
   - Copy "Client ID" (starts with `ca_`)
   - Set in Railway environment variables

2. **Check backend logs:**
   ```
   Stripe Connect onboarding URL created for user USER_ID
   ```

3. **Test Connect onboarding endpoint:**
   ```bash
   curl -X POST https://your-backend-url.railway.app/api/stripe/connect/onboard \
     -H "Content-Type: application/json" \
     -H "x-user-id: USER_ID" \
     -d '{"returnUrl":"https://your-app.com","refreshUrl":"https://your-app.com"}'
   ```

4. **Complete test onboarding:**
   - Use Stripe test account details
   - Phone: 000-000-0000
   - DOB: 01/01/1990
   - SSN: 000-00-0000

---

### Issue: Platform fee not being deducted

**Symptom:**
Helper receives full payment, no platform fee taken

**Cause:** application_fee_amount not set in checkout session

**Solution:**
1. **Check server.js line 522-525:**
   ```javascript
   const platformFee = Math.round(task.price * platformFeePercent);
   ```
2. **Verify PLATFORM_FEE_PERCENT is set:**
   ```bash
   # Should be 15 (for 15%)
   ```
3. **Check Stripe payment details:**
   - Go to Stripe Dashboard → Payments
   - Click on payment
   - Look for "Application fee"
4. **For tips:** Platform fee should be 0 (line 1119 in server.js)

---

## Email Issues

### Issue: OTP emails not sending

**Symptom:**
User enters email, no email received

**Cause:** RESEND_API_KEY not configured (expected in development)

**Solution:**
1. **Development mode (NO EMAIL):**
   - OTP codes log to Railway console
   - Check logs: `[DEV] OTP Code for email: 123456`
   - Use code from logs

2. **Production mode (SEND EMAIL):**
   - Get Resend API key: https://resend.com/api-keys
   - Add to Railway: `RESEND_API_KEY=re_...`
   - Redeploy backend
   - Test:
     ```bash
     curl https://your-backend-url.railway.app/api/test-email
     ```

3. **Check email service status:**
   - Backend logs should NOT show:
     ```
     ⚠️  RESEND_API_KEY not configured
     ```
   - Should show:
     ```
     Email sent successfully
     ```

---

### Issue: Emails going to spam

**Symptom:**
Emails send but land in spam folder

**Cause:** Using Resend's free tier with default sender

**Solution:**
1. **Verify domain with Resend:**
   - Go to Resend → Domains
   - Add your domain
   - Add DNS records
   - Verify domain

2. **Update DEFAULT_FROM in resend.js:**
   ```javascript
   const DEFAULT_FROM = 'CityTasks <noreply@yourdomain.com>';
   ```

3. **Use SPF, DKIM, DMARC:**
   - Resend provides these automatically for verified domains

4. **Test email deliverability:**
   - Use https://www.mail-tester.com/
   - Send test email to their address
   - Check spam score

---

## Deployment Issues

### Issue: Railway build fails

**Symptom:**
```
Error: npm install failed
Error: Cannot find module
```

**Cause:** Missing dependencies or build configuration

**Solution:**
1. **Check package.json exists:**
   ```bash
   ls backend/package.json
   ```

2. **Verify node_modules not committed:**
   ```bash
   # Add to .gitignore
   node_modules/
   .env
   ```

3. **Check Node version:**
   - Railway uses Node 18 by default
   - Specify in package.json:
     ```json
     "engines": {
       "node": "18.x"
     }
     ```

4. **Clear Railway cache:**
   - Railway service → Settings
   - Scroll to "Danger Zone"
   - Click "Clear Build Cache"
   - Trigger new deployment

---

### Issue: Railway deployment succeeds but app crashes

**Symptom:**
Build succeeds, but service shows "Crashed" status

**Diagnosis:**
1. Check Railway logs (click service → Deployments → View logs)
2. Look for startup errors
3. Common causes:
   - Missing environment variables
   - Database connection failure
   - Port binding issue

**Solution:**
1. **Verify all environment variables set**
2. **Check PORT binding:**
   ```javascript
   // server.js should have:
   const PORT = process.env.PORT || process.env.BACKEND_PORT || 5001;
   app.listen(PORT, '0.0.0.0', () => { ... });
   ```
3. **Test locally first:**
   ```bash
   cd backend
   npm install
   node server.js
   ```

---

### Issue: Environment variables not loading

**Symptom:**
```
undefined is not a valid environment variable
```

**Cause:** Railway environment variables not set or typo

**Solution:**
1. **Check Railway dashboard:**
   - Service → Variables tab
   - Verify all required variables are listed
   - Check for typos in variable names

2. **Variables are injected at runtime:**
   - Don't need .env file on Railway
   - Railway automatically loads variables

3. **Case sensitive:**
   - `STRIPE_SECRET_KEY` ≠ `stripe_secret_key`

4. **Restart service after adding variables:**
   - Railway → Service → Settings
   - Click "Restart"

---

## Performance Issues

### Issue: Slow API responses

**Symptom:**
API calls taking > 2 seconds

**Cause:** Database queries, external API calls, or cold starts

**Solution:**
1. **Check Railway logs for slow queries:**
   ```
   Query took 2500ms
   ```

2. **Add database indexes:**
   ```sql
   CREATE INDEX idx_tasks_status ON tasks(status);
   CREATE INDEX idx_tasks_created_at ON tasks(created_at);
   ```

3. **Optimize queries:**
   - Use `LIMIT` for pagination
   - Select only needed columns
   - Avoid N+1 queries

4. **Enable connection pooling:**
   ```javascript
   // In db.js
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20,
     idleTimeoutMillis: 30000
   });
   ```

5. **Railway cold starts:**
   - Free tier may have cold starts
   - Upgrade to keep service always running

---

### Issue: Frontend app laggy

**Symptom:**
Slow screen transitions, UI freezes

**Cause:** Heavy re-renders, large data sets, or inefficient code

**Solution:**
1. **Use React.memo for components**
2. **Optimize FlatList rendering:**
   ```javascript
   <FlatList
     data={tasks}
     renderItem={renderTask}
     windowSize={5}
     maxToRenderPerBatch={10}
     removeClippedSubviews={true}
   />
   ```

3. **Check for memory leaks:**
   - Unsubscribe from listeners on unmount
   - Cancel pending API calls

4. **Reduce API calls:**
   - Implement caching in AppContext
   - Use pull-to-refresh instead of auto-refresh

5. **Profile with React DevTools:**
   ```bash
   npx expo start
   # Press 'j' to open debugger
   ```

---

## Getting Help

### Where to find logs

**Railway Backend Logs:**
1. Go to Railway dashboard
2. Click backend service
3. Click "Deployments" tab
4. Click latest deployment
5. View logs in real-time

**Railway Database Logs:**
1. Click PostgreSQL service
2. View logs for connection issues

**Stripe Logs:**
1. Go to https://dashboard.stripe.com/test/logs
2. See all API calls and webhooks

**Frontend Logs:**
1. Expo dev tools console
2. React Native debugger
3. Browser console (for web version)

---

### Common log messages decoded

**✅ Success messages:**
```
Database tables initialized
✅ Backend running on http://0.0.0.0:5001
[LOG] task_created: { taskId: '...', ... }
[WEBHOOK] checkout.session.completed
Job {taskId} accepted, payment confirmed
```

**⚠️ Warning messages:**
```
⚠️  RESEND_API_KEY not configured - email sending disabled
Warning: Database pool at max capacity
```

**❌ Error messages:**
```
❌ Failed to start server: Error: ...
Error: Missing API key
ECONNREFUSED
Error: relation "users" does not exist
Error: Webhook signature verification failed
```

---

### Debug checklist

When troubleshooting ANY issue, check these in order:

1. **Railway backend logs** - Is backend running?
2. **Environment variables** - Are all required variables set?
3. **Database connection** - Can backend connect to database?
4. **Frontend API URL** - Is EXPO_PUBLIC_API_URL correct?
5. **Stripe configuration** - Are Stripe keys valid?
6. **Network connectivity** - Can frontend reach backend?
7. **User authentication** - Is x-user-id header being sent?
8. **Browser console** - Any JavaScript errors?
9. **Stripe webhook** - Is webhook configured and firing?
10. **Test with curl** - Isolate frontend vs backend issues

---

### Still stuck?

1. **Check GitHub Issues:** Look for similar problems
2. **Railway Support:** https://help.railway.app/
3. **Stripe Support:** https://support.stripe.com/
4. **Expo Forums:** https://forums.expo.dev/
5. **Stack Overflow:** Tag questions with: `railway`, `stripe`, `expo`, `postgresql`

---

## Quick Reference

### Essential URLs

- **Backend health:** `https://your-backend.railway.app/health`
- **API health:** `https://your-backend.railway.app/api/health`
- **Stripe config:** `https://your-backend.railway.app/api/stripe/config`
- **Railway dashboard:** https://railway.app/project/your-project
- **Stripe dashboard:** https://dashboard.stripe.com/test
- **Resend dashboard:** https://resend.com/emails

### Essential Commands

```bash
# Test backend
curl https://your-backend.railway.app/health

# Restart Expo
npx expo start --clear

# View Railway logs
railway logs

# Test Stripe webhook
stripe listen --forward-to localhost:5001/api/stripe/webhook

# Connect to database
railway run psql $DATABASE_URL
```

### Critical Environment Variables

**Backend must have:**
- DATABASE_URL
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_CONNECT_CLIENT_ID

**Frontend must have:**
- EXPO_PUBLIC_API_URL

**Optional but recommended:**
- STRIPE_WEBHOOK_SECRET
- RESEND_API_KEY

---

**Last Updated:** 2025-12-08
**Version:** 1.0
