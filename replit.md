# CityTasks - Mobile Task Marketplace

## Overview
CityTasks is a dual-sided mobile marketplace app where customers post and pay for local tasks upfront, and workers browse funded jobs and accept them. Built with React Native and Expo. Now with Supabase backend integration for multi-user sync.

## Current State
- **Version**: 1.1.0 - Supabase Integration
- **Status**: Backend integration in progress
- **Last Updated**: December 2024

## Project Architecture

### Tech Stack
- React Native with Expo SDK 54
- React Navigation 7 for routing
- Supabase PostgreSQL for backend & real-time sync
- AsyncStorage for offline-first data persistence
- TypeScript for type safety

### Key Features
1. **Dual-Interface Design**: Customers and Workers see different views
2. **Task Posting**: Customers create tasks with title, description, neighborhood, price
3. **Upfront Payment**: Mock payment (Stripe-ready)
4. **Job Board**: Workers see funded tasks with green badges
5. **Task Acceptance**: Workers accept available jobs instantly
6. **In-App Messaging**: Real-time communication between users
7. **Status Tracking**: Unpaid → Paid-Waiting → Assigned → Completed
8. **Role Switching**: Toggle between Customer and Worker modes
9. **Rating System**: Rate users after task completion
10. **Photo Support**: Task details and completion proofs (URL storage)

### Data Persistence Strategy
- **Primary**: AsyncStorage for offline-first offline-capable mobile experience
- **Secondary**: Supabase for multi-user sync when available
- **Fallback**: App works fully offline, syncs when connection restored

### Database Schema (Supabase)
Tables to create in Supabase:
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT CHECK (role IN ('customer', 'worker')),
  avgRating DECIMAL,
  totalRatings INTEGER,
  stripeConnectId TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  customerId TEXT NOT NULL REFERENCES users(id),
  customerName TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  price DECIMAL NOT NULL,
  timeWindow TEXT NOT NULL,
  status TEXT CHECK (status IN ('unpaid', 'paid_waiting', 'assigned', 'completed')),
  workerId TEXT REFERENCES users(id),
  workerName TEXT,
  photoUrl TEXT,
  completionPhotoUrl TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  completedAt TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL REFERENCES tasks(id),
  senderId TEXT NOT NULL REFERENCES users(id),
  senderName TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Conversations table
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL REFERENCES tasks(id),
  taskTitle TEXT NOT NULL,
  otherUserId TEXT NOT NULL REFERENCES users(id),
  otherUserName TEXT NOT NULL,
  lastMessage TEXT,
  lastMessageTime TIMESTAMP,
  unreadCount INTEGER DEFAULT 0
);

-- Ratings table
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL REFERENCES tasks(id),
  ratedUserId TEXT NOT NULL REFERENCES users(id),
  ratingUserId TEXT NOT NULL REFERENCES users(id),
  ratingUserName TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 5),
  review TEXT,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Storage buckets
-- Create bucket: task_photos
-- Create bucket: completion_photos
```

### Directory Structure
```
├── App.tsx                    # Root with providers
├── context/
│   └── AppContext.tsx         # State + offline-first sync logic
├── services/
│   └── supabase.ts            # Supabase queries with fallbacks
├── types/
│   └── index.ts               # Shared types & constants
├── navigation/
│   ├── RootNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── ... (other navigators)
├── screens/
│   ├── OnboardingScreen.tsx
│   ├── CustomerHomeScreen.tsx
│   ├── WorkerHomeScreen.tsx
│   ├── CreateTaskScreen.tsx
│   ├── PaymentScreen.tsx
│   └── ... (other screens)
├── components/
│   ├── TaskCard.tsx
│   ├── StatusBadge.tsx
│   └── ... (UI components)
├── constants/
│   └── theme.ts               # Design tokens
└── hooks/
    └── ... (shared hooks)
```

### Implementation Status
✅ Offline-first AsyncStorage data layer
✅ Supabase service layer with fallbacks
✅ Enhanced types (Rating, photo URLs)
✅ Safe query wrappers for graceful failures
⏳ Database migration to Supabase
⏳ Photo upload UI components
⏳ Stripe Connect worker payouts
⏳ Push notifications

### Environment Variables Required
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Next Steps
1. Create Supabase tables with SQL above
2. Add photo upload UI in CreateTaskScreen
3. Implement Stripe Connect for payouts
4. Add push notifications via Expo
5. Deploy to production

## Design System
- Primary: #00B87C (green - success/funded)
- Secondary: #5B6EFF (blue - worker/action)
- iOS 26 liquid glass design principles
- Feather icons from @expo/vector-icons
