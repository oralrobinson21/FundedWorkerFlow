# CityTasks - Mobile Task Marketplace

## Overview
CityTasks is a dual-sided mobile marketplace app where customers post and pay for local tasks upfront, and workers browse funded jobs and accept them. Built with React Native and Expo.

## Current State
- **Version**: 1.0.0 MVP
- **Status**: Functional with local persistence
- **Last Updated**: December 2024

## Project Architecture

### Tech Stack
- React Native with Expo SDK 54
- React Navigation 7 for routing
- AsyncStorage for local data persistence
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

### Directory Structure
```
├── App.tsx                    # Root component with providers
├── context/
│   └── AppContext.tsx         # Global state management
├── types/
│   └── index.ts               # TypeScript types and constants
├── navigation/
│   ├── RootNavigator.tsx      # Auth-based navigation
│   ├── MainTabNavigator.tsx   # Tab bar with FAB
│   ├── HomeStackNavigator.tsx # Home screen stack
│   ├── MessagesStackNavigator.tsx
│   ├── ActivityStackNavigator.tsx
│   ├── ProfileStackNavigator.tsx
│   └── types.ts               # Navigation types
├── screens/
│   ├── OnboardingScreen.tsx   # Role selection
│   ├── CustomerHomeScreen.tsx # Customer's task list
│   ├── WorkerHomeScreen.tsx   # Available jobs
│   ├── CreateTaskScreen.tsx   # Task creation form
│   ├── PaymentScreen.tsx      # Payment UI (mock)
│   ├── TaskDetailScreen.tsx   # Task details and actions
│   ├── ChatScreen.tsx         # Messaging
│   ├── MessagesScreen.tsx     # Conversation list
│   ├── ActivityScreen.tsx     # History/earnings
│   └── ProfileScreen.tsx      # User profile and settings
├── components/
│   ├── TaskCard.tsx           # Task display card
│   ├── StatusBadge.tsx        # Status indicators
│   ├── FloatingActionButton.tsx
│   └── ... (shared UI components)
├── constants/
│   └── theme.ts               # Design system tokens
└── hooks/
    └── ... (shared hooks)
```

### Data Flow
- User data, tasks, conversations, and messages stored in AsyncStorage
- AppContext provides global state and actions
- Navigation adapts based on user role and authentication

### Design System
- Primary color: #00B87C (green - funded/success)
- Secondary color: #5B6EFF (blue - worker/progress)
- Following iOS 26 liquid glass design principles
- Feather icons from @expo/vector-icons

## User Preferences
- No emojis in the UI
- Clean, professional design
- Mobile-first experience

## Next Steps for Production
1. Connect Stripe for real payments
2. Add backend API for multi-user sync
3. Implement push notifications
4. Add photo uploads for tasks
5. Rating and review system
