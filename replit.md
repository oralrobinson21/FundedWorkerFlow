# CityTasks MVP - Project Status

## Overview
Marketplace app where posters post job requests for free, helpers send offers with notes, posters choose a helper and pay via Stripe Checkout, then chat and complete the job with photo proof.

## Architecture
- **Frontend**: Expo/React Native mobile app
- **Backend**: Node.js/Express API with Stripe Connect Express integration
- **Auth**: Email + OTP passwordless login with 6-digit codes (logged to console in dev)
- **Database**: PostgreSQL via Replit's built-in database

## Current Status

### ✅ Completed MVP
- Email + OTP authentication system with LoginScreen and VerifyScreen
- User mode selection (poster/helper) with OnboardingScreen
- Standardized terminology: poster/helper throughout (not customer/worker)
- Type definitions with Stripe fields and proper TaskStatus enum
- AppContext with all methods including userMode, setUserMode, sendOTPCode, verifyOTPCode
- Screens: LoginScreen, VerifyScreen, OnboardingScreen, CategoryScreen, CreateTaskScreen, JobListScreen, TaskDetailScreen, ProfileScreen, MessagesScreen
- Full backend API integration with proper URL routing

### ✅ Backend Implementation
- Express server on port 5000 with all endpoints
- Stripe Connect Express onboarding for helpers
- Task creation with $7 minimum enforcement
- Offer system
- Stripe Checkout Session creation
- Webhook handler for payment success
- Chat system with proof photos
- Task completion with photo validation
- Cancel/dispute endpoints

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

## Environment Configuration
**Critical for Replit deployment:**
- `EXPO_PUBLIC_API_URL`: Must point to the backend domain (e.g., https://...-00-....replit.dev)
- Backend runs on port 5000 (Replit's primary exposed port)
- Frontend (Expo web) runs on port 8081
- The frontend uses app.json `extra.apiUrl` or `EXPO_PUBLIC_API_URL` environment variable

**Backend Environment:**
- PORT (5000)
- STRIPE_SECRET_KEY (via Replit Stripe integration)
- STRIPE_PUBLISHABLE_KEY 
- STRIPE_WEBHOOK_SECRET
- DATABASE_URL (PostgreSQL)
- PLATFORM_FEE_PERCENT (15)
- MIN_JOB_PRICE_USD (7)

## API Endpoints
- POST /api/auth/send-otp - Send OTP to email
- POST /api/auth/verify-otp - Verify OTP and create/return user
- GET /api/tasks - List available tasks (with zipCode filtering)
- POST /api/tasks - Create a new task
- POST /api/offers - Submit offer on a task
- POST /api/checkout - Create Stripe Checkout session
- POST /api/stripe-webhook - Handle Stripe payment events
- POST /api/chats/:chatId/messages - Send chat message
- POST /api/tasks/:taskId/complete - Mark task complete with proof

## Dev Notes
- OTP codes logged to console as: `[DEV] OTP Code for {email}: {code}`
- All Stripe operations use test mode during development
- For native/Expo Go builds, set EXPO_PUBLIC_API_URL to the backend's public URL
- The backend must be started separately: `cd backend && node server.js`

## Testing
- Auth flow tested and working (onboarding → email → OTP → verification)
- Backend health check returns 200
- Frontend-backend connectivity verified via automated tests
