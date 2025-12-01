# CityTasks - Mobile Task Marketplace

## Overview
CityTasks is a dual-sided mobile marketplace app where customers post and pay for local tasks upfront, and workers browse funded jobs and accept them. Built with React Native and Expo. Now transitioning to Supabase backend.

## Current State
- **Version**: 1.1.0 - Supabase Integration Phase
- **Status**: Implementing multi-user sync with Supabase
- **Last Updated**: December 2024

## Project Architecture

### Tech Stack
- React Native with Expo SDK 54
- React Navigation 7 for routing
- Supabase for backend & real-time sync
- Fallback to AsyncStorage for offline support
- TypeScript for type safety

### Key Features
1. **Dual-Interface Design**: Customers and Workers see different views
2. **Task Posting**: Customers create tasks with title, description, neighborhood, price, and time window
3. **Payment Flow**: Mock payment integration (ready for Stripe)
4. **Job Board**: Workers see green-badged "funded" tasks
5. **Task Acceptance**: Workers can accept available jobs
6. **In-App Messaging**: Communication between customers and workers
7. **Status Tracking**: Unpaid → Paid-Waiting → Assigned → Completed
8. **Role Switching**: Users can switch between Customer and Worker modes
9. **Rating System**: Users can rate each other after task completion
10. **Photo Support**: Task details and completion proofs (URLs stored)

### Directory Structure
```
├── App.tsx
├── context/
│   └── AppContext.tsx         # Global state with Supabase sync
├── services/
│   └── supabase.ts            # Supabase queries & photo upload
├── types/
│   └── index.ts               # Updated with Rating & photo fields
├── navigation/
│   ├── RootNavigator.tsx
│   ├── MainTabNavigator.tsx
│   ├── HomeStackNavigator.tsx
│   ├── MessagesStackNavigator.tsx
│   ├── ActivityStackNavigator.tsx
│   ├── ProfileStackNavigator.tsx
│   └── types.ts
├── screens/
│   ├── OnboardingScreen.tsx
│   ├── CustomerHomeScreen.tsx
│   ├── WorkerHomeScreen.tsx
│   ├── CreateTaskScreen.tsx
│   ├── PaymentScreen.tsx
│   ├── TaskDetailScreen.tsx
│   ├── ChatScreen.tsx
│   ├── MessagesScreen.tsx
│   ├── ActivityScreen.tsx
│   └── ProfileScreen.tsx
├── components/
│   ├── TaskCard.tsx
│   ├── StatusBadge.tsx
│   ├── FloatingActionButton.tsx
│   └── ... (shared UI components)
├── constants/
│   └── theme.ts               # Design system tokens
└── hooks/
    └── ... (shared hooks)
```

### Database Schema (Supabase)
- **users**: User profiles with role and ratings
- **tasks**: Task listings with status and photo URLs
- **messages**: Task-related messages
- **conversations**: User conversations per task
- **ratings**: User ratings and reviews
- **task_photos**: Before/after task photos storage

### Data Flow
- User data synced with Supabase when connected
- Tasks, conversations, and messages sync in real-time
- Fallback to AsyncStorage for offline access
- Photos stored in Supabase storage buckets

### Design System
- Primary color: #00B87C (green - funded/success)
- Secondary color: #5B6EFF (blue - worker/progress)
- Following iOS 26 liquid glass design principles
- Feather icons from @expo/vector-icons

## User Preferences
- No emojis in the UI
- Clean, professional design
- Mobile-first experience

## Environment Variables Required
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps for Production
1. Configure Supabase tables and storage buckets
2. Implement Stripe Connect for worker payouts
3. Add push notifications via Expo Push Notifications
4. Complete photo upload UI in CreateTaskScreen
5. Deploy backend migrations
