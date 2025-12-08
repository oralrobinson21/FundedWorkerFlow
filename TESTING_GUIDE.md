# FundedWorkerFlow Testing & Verification Guide

Complete testing checklist and scripts to verify your app is running at 100%.

---

## Quick Test Scripts

### Test 1: Backend Health Check
```bash
# Replace YOUR_BACKEND_URL with your actual Railway URL
curl https://YOUR_BACKEND_URL.railway.app/health

# Expected: {"status":"ok"}
```

### Test 2: API Health Check
```bash
curl https://YOUR_BACKEND_URL.railway.app/api/health

# Expected: {"status":"ok","timestamp":"2025-12-08T..."}
```

### Test 3: Stripe Configuration
```bash
curl https://YOUR_BACKEND_URL.railway.app/api/stripe/config

# Expected: {"publishableKey":"pk_test_..."}
```

### Test 4: Database Tables Check

Connect to Railway PostgreSQL and run:
```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Expected tables:
-- users, otp_codes, tasks, offers, chat_threads, chat_messages,
-- activity_logs, extra_work_requests, disputes
```

### Test 5: Send OTP (API Test)
```bash
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"both"}'

# Expected: {"success":true}
# Check Railway logs for OTP code
```

---

## Complete End-to-End Test Flow

### Test Flow 1: User Registration & Authentication ✅

**Test Steps:**
1. [ ] Open app, navigate to login screen
2. [ ] Enter email: `test1@example.com`
3. [ ] Click "Continue" button
4. [ ] Check Railway backend logs for OTP code:
   ```
   [DEV] OTP Code for test1@example.com: 123456
   ```
5. [ ] Enter OTP code from logs
6. [ ] App navigates to home screen
7. [ ] User is logged in

**Verify:**
- [ ] No errors in app
- [ ] Backend logs show: `[LOG] otp_sent` and `[LOG] user_verified`
- [ ] User appears in database:
  ```sql
  SELECT id, email, name, created_at FROM users WHERE email = 'test1@example.com';
  ```

**Expected Result:** ✅ User created and logged in successfully

---

### Test Flow 2: Task Creation (Poster) ✅

**Prerequisites:** User logged in as "Poster"

**Test Steps:**
1. [ ] Switch to "Poster" mode (if needed)
2. [ ] Click "Create Task" or "+" button
3. [ ] Fill in task details:
   - Title: "Test Task - Paint Fence"
   - Description: "Need someone to paint my white fence"
   - Price: $50
   - Category: "Home Improvement"
   - Location: "123 Main St"
4. [ ] Upload task photo (optional)
5. [ ] Submit task
6. [ ] Task appears in "My Tasks" list

**Verify:**
- [ ] Backend logs show: `[LOG] task_created: { taskId: '...', userId: '...' }`
- [ ] Task in database:
  ```sql
  SELECT id, title, description, price, status FROM tasks WHERE poster_id = 'USER_ID';
  ```
- [ ] Status should be "pending"

**Expected Result:** ✅ Task created and visible in list

---

### Test Flow 3: Offer Submission (Helper) ✅

**Prerequisites:** Task exists, logged in as different user (helper)

**Test Steps:**
1. [ ] Login as second user (helper): `helper1@example.com`
2. [ ] Switch to "Helper" mode
3. [ ] Browse available tasks
4. [ ] Find "Test Task - Paint Fence"
5. [ ] Click task to view details
6. [ ] Click "Send Offer" button
7. [ ] Enter offer details:
   - Proposed price: $45
   - Note: "I can complete this tomorrow"
8. [ ] Submit offer
9. [ ] Success message appears

**Verify:**
- [ ] Backend logs show: `[LOG] offer_submitted: { offerId: '...', taskId: '...' }`
- [ ] Offer in database:
  ```sql
  SELECT id, task_id, helper_id, proposed_price, note, status
  FROM offers WHERE task_id = 'TASK_ID';
  ```
- [ ] Status should be "pending"

**Expected Result:** ✅ Offer submitted and saved

---

### Test Flow 4: Stripe Connect Onboarding (Helper) ✅

**Prerequisites:** Logged in as helper who will receive payments

**Test Steps:**
1. [ ] Navigate to profile or earnings screen
2. [ ] Click "Setup Payouts" or similar button
3. [ ] App calls `/api/stripe/connect/onboard`
4. [ ] Redirected to Stripe Connect onboarding
5. [ ] Complete Stripe onboarding form (use test data)
6. [ ] Return to app
7. [ ] Payout setup shows as complete

**Verify:**
- [ ] Backend logs show: `Stripe Connect onboarding URL created`
- [ ] User has `stripe_account_id` in database:
  ```sql
  SELECT id, email, stripe_account_id FROM users WHERE email = 'helper1@example.com';
  ```
- [ ] Check Stripe Dashboard → Connect → Accounts (account appears)

**Expected Result:** ✅ Helper can receive payments via Stripe Connect

---

### Test Flow 5: Choose Helper & Payment ✅

**Prerequisites:** Task with offers exists, helper has Stripe Connect setup

**Test Steps:**
1. [ ] Login as poster (task creator)
2. [ ] Open task "Test Task - Paint Fence"
3. [ ] View offers list
4. [ ] Click "Choose" on helper's offer
5. [ ] Redirected to Stripe Checkout page
6. [ ] Enter test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
7. [ ] Complete payment
8. [ ] Redirected back to app
9. [ ] Task status changes to "accepted"
10. [ ] Chat becomes available

**Verify:**
- [ ] Backend logs show:
  ```
  Stripe checkout session created for task TASK_ID
  [WEBHOOK] checkout.session.completed
  Job {taskId} accepted, payment confirmed, chat created
  ```
- [ ] Task status in database:
  ```sql
  SELECT id, title, status, accepted_helper_id FROM tasks WHERE id = 'TASK_ID';
  ```
- [ ] Status should be "accepted"
- [ ] Chat thread created:
  ```sql
  SELECT id, task_id, poster_id, helper_id FROM chat_threads WHERE task_id = 'TASK_ID';
  ```

**Expected Result:** ✅ Payment processed, task accepted, chat created

---

### Test Flow 6: Chat Messaging ✅

**Prerequisites:** Task accepted, chat thread exists

**Test Steps:**
1. [ ] Login as poster or helper
2. [ ] Open accepted task
3. [ ] Navigate to chat
4. [ ] Send message: "Hello, when can you start?"
5. [ ] Message appears in chat
6. [ ] Login as other user
7. [ ] Open same chat
8. [ ] See previous message
9. [ ] Reply: "I can start tomorrow at 9am"
10. [ ] Both messages visible

**Verify:**
- [ ] Backend logs show: `[LOG] message_sent`
- [ ] Messages in database:
  ```sql
  SELECT id, sender_id, message, created_at
  FROM chat_messages
  WHERE thread_id = 'THREAD_ID'
  ORDER BY created_at;
  ```

**Expected Result:** ✅ Chat works bidirectionally

---

### Test Flow 7: Task Completion ✅

**Prerequisites:** Task accepted, work done

**Test Steps:**
1. [ ] Login as helper
2. [ ] Open accepted task
3. [ ] Upload completion photo (if required)
4. [ ] Click "Mark Complete" button
5. [ ] Confirmation message appears
6. [ ] Task status changes to "completed"
7. [ ] Login as poster
8. [ ] See task as completed
9. [ ] Option to tip appears

**Verify:**
- [ ] Backend logs show: `Task TASK_ID marked complete`
- [ ] Task status in database:
  ```sql
  SELECT id, status, completed_at FROM tasks WHERE id = 'TASK_ID';
  ```
- [ ] Status should be "completed"

**Expected Result:** ✅ Task marked complete successfully

---

### Test Flow 8: Extra Work Request ✅

**Prerequisites:** Task accepted

**Test Steps:**
1. [ ] Login as helper
2. [ ] Open accepted task
3. [ ] Click "Request Extra Work"
4. [ ] Enter details:
   - Amount: $20
   - Reason: "Additional materials needed"
5. [ ] Submit request
6. [ ] Login as poster
7. [ ] See extra work request
8. [ ] Click "Accept"
9. [ ] Redirected to Stripe Checkout
10. [ ] Complete payment with test card
11. [ ] Extra work marked as paid

**Verify:**
- [ ] Backend logs show:
  ```
  Extra work request created
  [WEBHOOK] checkout.session.completed (type: extra_work)
  Extra work request EXTRA_ID paid
  ```
- [ ] Extra work in database:
  ```sql
  SELECT id, task_id, amount, reason, status
  FROM extra_work_requests WHERE task_id = 'TASK_ID';
  ```
- [ ] Status should be "paid"

**Expected Result:** ✅ Extra work paid successfully

---

### Test Flow 9: Tip Payment ✅

**Prerequisites:** Task completed

**Test Steps:**
1. [ ] Login as poster
2. [ ] Open completed task
3. [ ] Click "Tip Helper" button
4. [ ] Enter tip amount: $10
5. [ ] Redirected to Stripe Checkout
6. [ ] Complete payment with test card
7. [ ] Tip recorded on task

**Verify:**
- [ ] Backend logs show:
  ```
  Tip checkout session created
  [WEBHOOK] checkout.session.completed (type: tip)
  Tip recorded for task TASK_ID
  ```
- [ ] Tip in database:
  ```sql
  SELECT id, tip_amount FROM tasks WHERE id = 'TASK_ID';
  ```
- [ ] tip_amount should be 10.00

**Expected Result:** ✅ Tip processed (100% goes to helper, 0% platform fee)

---

### Test Flow 10: Dispute Creation ✅

**Prerequisites:** Task accepted

**Test Steps:**
1. [ ] Login as poster or helper
2. [ ] Open accepted task
3. [ ] Click "Dispute" or report issue
4. [ ] Enter dispute details:
   - Reason: "Work quality issue"
   - Description: "Fence was not painted properly"
5. [ ] Upload evidence photo
6. [ ] Submit dispute
7. [ ] Task status changes to "disputed"

**Verify:**
- [ ] Backend logs show: `Dispute created for task TASK_ID`
- [ ] Dispute in database:
  ```sql
  SELECT id, task_id, filed_by, reason, status
  FROM disputes WHERE task_id = 'TASK_ID';
  ```
- [ ] Task status:
  ```sql
  SELECT id, status FROM tasks WHERE id = 'TASK_ID';
  ```
- [ ] Status should be "disputed"

**Expected Result:** ✅ Dispute created, task marked as disputed

---

## Error Cases Testing

### Test: Invalid Email Format
```bash
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","name":"Test","role":"both"}'

# Expected: {"success":false,"error":"Invalid email format"}
```

### Test: Wrong OTP Code
```bash
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"000000"}'

# Expected: {"success":false,"error":"Invalid or expired code"}
```

### Test: Task Below Minimum Price
```bash
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/tasks \
  -H "Content-Type: application/json" \
  -H "x-user-id: USER_ID" \
  -d '{
    "title":"Test",
    "description":"Test",
    "price":5,
    "category":"Test"
  }'

# Expected: {"success":false,"error":"Minimum job price is $7.00"}
```

### Test: Choose Helper Without Stripe Connect
```bash
# Helper without stripe_account_id set up
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/tasks/TASK_ID/choose-helper \
  -H "Content-Type: application/json" \
  -H "x-user-id: POSTER_ID" \
  -d '{"offerId":"OFFER_ID"}'

# Expected: {"success":false,"error":"Helper has not set up Stripe Connect"}
```

---

## Performance Testing

### Test: API Response Times

```bash
# Health endpoint (should be < 100ms)
time curl https://YOUR_BACKEND_URL.railway.app/health

# API health endpoint (should be < 200ms)
time curl https://YOUR_BACKEND_URL.railway.app/api/health

# Task list endpoint (should be < 500ms)
time curl https://YOUR_BACKEND_URL.railway.app/api/tasks
```

### Test: Database Query Performance

```sql
-- Check slow queries in Railway logs
-- Look for queries taking > 1000ms

-- Test task listing query
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20;

-- Test offers query
EXPLAIN ANALYZE SELECT * FROM offers WHERE task_id = 'TASK_ID' ORDER BY created_at DESC;
```

---

## Security Testing

### Test: Unauthorized Access
```bash
# Try accessing protected endpoint without x-user-id
curl https://YOUR_BACKEND_URL.railway.app/api/my-tasks

# Expected: Should return error or empty result
```

### Test: Cross-User Access
```bash
# Try updating someone else's task
curl -X PUT https://YOUR_BACKEND_URL.railway.app/api/users/OTHER_USER_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: YOUR_USER_ID" \
  -d '{"name":"Hacked"}'

# Expected: Should fail or not update
```

### Test: Stripe Webhook Signature
```bash
# Send webhook without valid signature
curl -X POST https://YOUR_BACKEND_URL.railway.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed"}'

# Expected: {"error":"Webhook signature verification failed"}
```

---

## Automated Test Script

Create a file `test-backend.sh`:

```bash
#!/bin/bash

# FundedWorkerFlow Backend Test Script

BACKEND_URL="https://YOUR_BACKEND_URL.railway.app"

echo "🧪 Testing FundedWorkerFlow Backend..."
echo ""

# Test 1: Health check
echo "1. Testing /health endpoint..."
HEALTH=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $HEALTH"
fi
echo ""

# Test 2: API health check
echo "2. Testing /api/health endpoint..."
API_HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$API_HEALTH" | grep -q "ok"; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed: $API_HEALTH"
fi
echo ""

# Test 3: Stripe config
echo "3. Testing Stripe configuration..."
STRIPE_CONFIG=$(curl -s "$BACKEND_URL/api/stripe/config")
if echo "$STRIPE_CONFIG" | grep -q "publishableKey"; then
  echo "✅ Stripe config available"
else
  echo "❌ Stripe config failed: $STRIPE_CONFIG"
fi
echo ""

# Test 4: Send OTP
echo "4. Testing OTP sending..."
OTP_RESULT=$(curl -s -X POST "$BACKEND_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","role":"both"}')
if echo "$OTP_RESULT" | grep -q "success"; then
  echo "✅ OTP send endpoint working"
else
  echo "❌ OTP send failed: $OTP_RESULT"
fi
echo ""

echo "🎉 Test suite complete!"
echo ""
echo "Next steps:"
echo "1. Check Railway logs for OTP code"
echo "2. Test frontend connection"
echo "3. Complete end-to-end user flow"
```

Make executable and run:
```bash
chmod +x test-backend.sh
./test-backend.sh
```

---

## Monitoring & Logs

### Railway Logs to Monitor

**Success indicators:**
```
Database tables initialized
✅ Backend running on http://0.0.0.0:5001
[DEV] OTP Code for email: 123456
[LOG] task_created: { taskId: '...', ... }
[LOG] offer_submitted: { offerId: '...', ... }
[WEBHOOK] checkout.session.completed
Job {taskId} accepted, payment confirmed, chat created
```

**Error indicators to watch for:**
```
❌ Failed to start server
Error: Missing API key
ECONNREFUSED (database connection failed)
Error: Webhook signature verification failed
Error: Helper has not set up Stripe Connect
```

### Stripe Dashboard Monitoring

Check these sections:
- **Payments** → See all test payments
- **Connect** → See connected accounts (helpers)
- **Webhooks** → See webhook deliveries and responses
- **Logs** → See all API calls

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE 'test%@example.com';

-- Delete test tasks
DELETE FROM tasks WHERE title LIKE 'Test Task%';

-- Delete test offers
DELETE FROM offers WHERE note LIKE 'Test%';

-- Delete test chat messages
DELETE FROM chat_messages WHERE message LIKE 'Test%';
```

**Warning:** Only run in development/test database!

---

## Success Criteria Checklist

Your app is at **100%** when:

- [ ] ✅ Backend starts without crashes
- [ ] ✅ Database tables initialized
- [ ] ✅ Health endpoints return success
- [ ] ✅ Stripe configuration available
- [ ] ✅ Users can register with OTP
- [ ] ✅ Tasks can be created
- [ ] ✅ Offers can be submitted
- [ ] ✅ Stripe Connect onboarding works
- [ ] ✅ Payments process successfully
- [ ] ✅ Webhooks received and processed
- [ ] ✅ Chat messages send and receive
- [ ] ✅ Tasks can be completed
- [ ] ✅ Extra work payments work
- [ ] ✅ Tips can be given
- [ ] ✅ Disputes can be created
- [ ] ✅ No errors in Railway logs during normal use
- [ ] ✅ All API response times acceptable
- [ ] ✅ Security tests pass

**When all checkboxes are checked: 🎉 Your app is running at 100%!**

---

**Last Updated:** 2025-12-08
**Version:** 1.0
