# CityTasks MVP - Project Status

## Overview
Marketplace app where posters post job requests for free, helpers send offers with notes, posters choose a helper and pay via Stripe Checkout, then chat and complete the job with photo proof.

## Architecture
- **Frontend**: Expo/React Native mobile app
- **Backend**: Node.js/Express API with Stripe Connect Express integration
- **Auth**: Email + OTP passwordless login with 6-digit codes (logged to console in dev)
- **Database**: PostgreSQL via Replit's built-in database

## Current Status

### ✅ Completed MVP Features
- Email + OTP authentication system with LoginScreen and VerifyScreen
- User mode selection (poster/helper) with OnboardingScreen
- Standardized terminology: poster/helper throughout (not customer/worker)
- Type definitions with Stripe fields and proper TaskStatus enum
- AppContext with all methods including userMode, setUserMode, sendOTPCode, verifyOTPCode
- Screens: LoginScreen, VerifyScreen, OnboardingScreen, CategoryScreen, CreateTaskScreen, JobListScreen, TaskDetailScreen, ProfileScreen, MessagesScreen
- Full backend API integration with proper URL routing

### ✅ Recent Updates
- **13 Job Categories**: Cleaning & Housekeeping, Moving & Heavy Lifting, Delivery & Pickups, Handyman & Repairs, Yardwork & Outdoors, Errands & Small Tasks, Tech Help, Pet Care, Car Help, Home Organizing, Babysitting & Senior Help, Beauty & Personal Services, Other
- **Tools Required/Provided**: Boolean fields on tasks for job matching
- **Profile Photo Requirement**: Enforced in UI and backend before posting tasks or sending offers
- **Job Filtering**: Helpers can filter by category, zip code, and tools required/provided
- **Activity Logging**: All major actions tracked in activity_logs table
- **Profile Photo Upload**: Camera and gallery photo picker in ProfileScreen
- **Extra Work / Counter-Offer Flow**: Helpers can request additional payment when job requires more work than described
- **Tip Function**: Posters can leave tips after job completion (100% goes to helper, no platform fee)
- **Task Photos**: Posters can upload 0-10 photos when creating tasks to show helpers the job scope

### ✅ Backend Implementation
- Express server on port 5000 with all endpoints
- Stripe Connect Express onboarding for helpers
- Task creation with $7 minimum enforcement + profile photo validation
- Offer system with profile photo validation
- Stripe Checkout Session creation for tasks, extra work, and tips
- Webhook handler for payment success (tasks, extra work, tips)
- Chat system with proof photos
- Task completion with photo validation
- Cancel/dispute endpoints
- Activity logging system with new events: extra_work_requested, extra_work_accepted, extra_work_paid, tip_created, tip_paid

## Payment Flow
1. Poster creates job (≥$7) → status="requested"
2. Helpers send offers
3. Poster chooses helper → Stripe Checkout created
4. Customer pays → webhook triggers
5. Webhook marks job "accepted" + creates chat + removes from queue
6. Helper can request extra work if needed → poster accepts/declines → separate checkout for extra
7. Helper uploads proof photo
8. Both confirm completion → job marked "completed"
9. Poster can leave a tip after completion
10. Stripe handles payouts automatically

## Extra Work Flow
1. Helper arrives on site, realizes more work than described
2. Helper taps "+" button in TaskDetailScreen → fills extra amount + reason
3. Poster sees card: "Helper requested extra $X for additional work"
4. Poster can Accept (creates new Stripe Checkout) or Decline
5. If accepted and paid → task.extra_amount_paid updated
6. If declined → job continues at original price (can open dispute if disagreement)

## Tip Flow
1. After task marked "completed", poster sees "Leave a Tip" button
2. Suggested amounts: $5, $10, $20, or custom
3. Creates Stripe Checkout for tip amount only
4. 100% of tip goes to helper (no platform fee)
5. Tip recorded in task and shown to both parties

## Key Constants
- Minimum job price: $7
- Platform fee: 15% (on job and extra work, NOT on tips)
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
- POST /api/tasks - Create a new task (requires profile photo)
- POST /api/tasks/:taskId/offers - Submit offer (requires profile photo)
- POST /api/tasks/:taskId/choose-helper - Choose helper and create checkout
- POST /api/stripe/webhook - Handle Stripe payment events (tasks, extra work, tips)
- POST /api/chats/:chatId/messages - Send chat message
- POST /api/tasks/:taskId/complete - Mark task complete with proof
- PUT /api/users/:userId/photo - Update profile photo
- GET /api/users/:userId/has-photo - Check if user has profile photo
- GET /api/activity-logs - Get activity logs
- POST /api/tasks/:taskId/extra-work - Create extra work request (helper)
- GET /api/tasks/:taskId/extra-work - Get extra work requests for task
- POST /api/extra-work/:requestId/accept - Accept extra work request (poster)
- POST /api/extra-work/:requestId/decline - Decline extra work request (poster)
- POST /api/tasks/:taskId/tip - Create tip checkout (poster, after completion)

## Database Tables
- users - User accounts with profile_photo_url
- tasks - Job postings with tools_required, tools_provided, tip_amount, extra_amount_paid, photos (TEXT[] for 0-10 task photos)
- offers - Helper offers with helper_photo_url
- extra_work_requests - Extra work requests from helpers
- chat_threads - Chat conversations
- chat_messages - Individual messages
- activity_logs - Event tracking (includes extra_work_*, tip_created, tip_paid events)

## Dev Notes
- OTP codes logged to console as: `[DEV] OTP Code for {email}: {code}`
- All Stripe operations use test mode during development
- For native/Expo Go builds, set EXPO_PUBLIC_API_URL to the backend's public URL
- **Backend must be started separately**: `cd backend && node server.js`
- The backend runs on port 5000, which is mapped to external port 8008 in .replit config
- Profile photos stored as local URIs (works in Expo Go)

### Running Locally
1. Start Expo: `npm run dev` (port 8081)
2. Start backend: `cd backend && node server.js` (port 5000)
3. For Expo Go testing, the API calls go directly to the backend on port 5000
4. For web testing, EXPO_PUBLIC_API_URL should point to the backend's accessible URL

## Testing
- Auth flow tested and working (onboarding → email → OTP → verification)
- Backend health check returns 200
- Frontend-backend connectivity verified via automated tests
- Profile photo enforcement tested in UI
