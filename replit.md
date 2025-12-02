# CityTasks MVP - Project Status

## Overview
Marketplace app where posters post job requests for free, helpers send offers with notes, posters choose a helper and pay via Stripe Checkout, then chat and complete the job with photo proof.

## Architecture
- **Frontend**: Expo/React Native mobile app (App directory)
- **Backend**: Node.js/Express API with Stripe Connect Express integration
- **Auth**: Email + OTP passwordless login with 6-digit codes (logged to console in dev)
- **Database**: Mock in-memory for MVP (ready for real DB)

## Current Status

### ✅ Completed
- Email + OTP authentication system with LoginScreen and VerifyScreen
- User mode selection (poster/helper) with OnboardingScreen
- Standardized terminology: poster/helper throughout (not customer/worker)
- Type definitions with Stripe fields and proper TaskStatus enum
- AppContext with all methods including userMode, setUserMode, sendOTPCode, verifyOTPCode
- Screens: LoginScreen, VerifyScreen, OnboardingScreen, CategoryScreen, CreateTaskScreen, JobListScreen, TaskDetailScreen, ProfileScreen, MessagesScreen

### ✅ Backend Implementation
- Express server with all endpoints
- Stripe Connect Express onboarding for helpers
- Task creation with $7 minimum enforcement
- Offer system
- Stripe Checkout Session creation
- Webhook handler for payment success
- Chat system with proof photos
- Task completion with photo validation
- Cancel/dispute endpoints

### 🔄 Next Steps
1. Connect frontend API calls to backend endpoints
2. Add Stripe test keys to environment
3. Build chat UI and photo upload screens
4. Test full payment flow end-to-end
5. Expand TaskDetail status badge mappings for all TaskStatus values

## Payment Flow
1. Poster creates job (≥$7) → status="requested"
2. Helpers send offers
3. Poster chooses helper → Stripe Checkout created
4. Customer pays → webhook triggers
5. Webhook marks job "accepted" + creates chat + removes from queue
6. Helper uploads proof photo
7. Both confirm completion → job marked "completed"
8. Stripe handles payouts automatically

## Key Constants
- Minimum job price: $7
- Platform fee: 15%
- Chat expiration: 3 days
- OTP expiration: 10 minutes

## Environment Variables
Backend (.env):
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_CONNECT_CLIENT_ID
- STRIPE_WEBHOOK_SECRET
- PLATFORM_FEE_PERCENT (15)
- MIN_JOB_PRICE_USD (7)
- FRONTEND_URL
- API_BASE_URL
- PORT (3001)

## Dev Notes
- OTP codes logged to console as: `[DEV] OTP Code for {email}: {code}`
- Backend uses mock in-memory DB for MVP
- All Stripe operations use test mode during development
- Webhook signature verification required for production
