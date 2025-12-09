# Firebase Push Notifications Setup Guide

## Overview

Firebase Cloud Messaging (FCM) has been integrated into Argu Fight to send push notifications when it's a user's turn in a debate. This works alongside your existing notification system (ticker, in-app notifications).

## What's Been Implemented

✅ **Database Schema**: `FCMToken` model to store user push notification tokens
✅ **Backend APIs**: 
   - `/api/fcm/register` - Register FCM token
   - `/api/fcm/send` - Send push notification (admin only)
   - `/api/firebase/config` - Get Firebase config for frontend
✅ **Frontend Component**: `PushNotificationManager` - Automatically requests permission and registers tokens
✅ **Integration**: Push notifications are sent automatically when:
   - It's a user's turn in a debate
   - A new challenge is received
   - A debate is accepted
   - Any other notification is created

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### Step 2: Add Web App to Firebase

1. In Firebase Console, click the gear icon → Project Settings
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register app with a nickname (e.g., "Argu Fight Web")
5. **Copy all the config values** - you'll need them in Step 3

### Step 3: Get Server Key

1. In Firebase Console → Project Settings → Cloud Messaging
2. Find "Server key" (or "Cloud Messaging API (Legacy)" key)
3. **Copy this key** - you'll need it in Step 4

### Step 4: Generate VAPID Key (for Web Push)

1. In Firebase Console → Project Settings → Cloud Messaging
2. Scroll to "Web Push certificates" section
3. Click "Generate key pair"
4. **Copy the key pair** - you'll need it in Step 5

### Step 5: Configure in Admin Dashboard

1. Log in as admin
2. Go to **Admin Dashboard → Settings**
3. Scroll to **"Firebase Push Notifications"** section
4. Fill in all the fields:
   - **Firebase API Key**: From Step 2
   - **Auth Domain**: From Step 2 (e.g., `your-project.firebaseapp.com`)
   - **Project ID**: From Step 2
   - **Storage Bucket**: From Step 2 (e.g., `your-project.appspot.com`)
   - **Messaging Sender ID**: From Step 2 (numeric ID)
   - **App ID**: From Step 2 (e.g., `1:123456789:web:...`)
   - **Server Key**: From Step 3 (starts with `AAAA...`)
   - **VAPID Key**: From Step 4 (starts with `BK...`)
5. Click **"Save Settings"**

### Step 6: Apply Database Migration

Run the migration to create the `fcm_tokens` table:

```bash
# Option 1: Apply migration directly to database
psql $DATABASE_URL -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql

# Option 2: Use Prisma migrate (if migration system works)
npx prisma migrate deploy
```

### Step 7: Test Push Notifications

1. **User grants permission**: When a user visits your site, they'll be asked to allow notifications
2. **Token registration**: The `PushNotificationManager` component automatically registers the token
3. **Test notification**: 
   - Have User A start a debate with User B
   - User A submits their argument
   - User B should receive a push notification (even if they're not on the site)

## How It Works

### For Users

1. **First Visit**: Browser asks "Allow notifications?"
2. **User Clicks Allow**: FCM token is generated and stored in database
3. **When It's Their Turn**: 
   - In-app notification is created (existing system)
   - Push notification is sent (new Firebase system)
   - User gets system notification even if browser is closed

### For Developers

1. **Notification Created**: `createDebateNotification()` is called
2. **Dual System**: 
   - In-app notification saved to database (existing)
   - Push notification sent via FCM (new)
3. **User Receives**: Both in-app notification (when on site) and push notification (always)

## Troubleshooting

### Push Notifications Not Working

1. **Check Firebase Config**: Ensure all fields are filled in Admin Settings
2. **Check Browser Support**: FCM requires HTTPS (works on localhost for development)
3. **Check Permissions**: User must grant notification permission
4. **Check Console**: Look for errors in browser console
5. **Check Server Logs**: Look for FCM errors in Vercel logs

### Common Issues

- **"Firebase not configured"**: Firebase config is missing in Admin Settings
- **"Permission denied"**: User denied notification permission (they can re-enable in browser settings)
- **"Invalid token"**: Token expired or invalid (will be automatically cleaned up)
- **"No FCM tokens found"**: User hasn't granted permission yet

## Cost

**Firebase Cloud Messaging is FREE:**
- ✅ Unlimited push notifications
- ✅ No per-message fees
- ✅ No monthly limits
- ✅ $0/month

## Next Steps

1. ✅ Configure Firebase in Admin Settings
2. ✅ Apply database migration
3. ✅ Test with real users
4. ✅ Monitor push notification delivery rates
5. ✅ Consider adding push notifications for other events (verdict ready, new challenge, etc.)

## API Endpoints

### Register FCM Token
```
POST /api/fcm/register
Body: { token: string, device?: string, userAgent?: string }
```

### Unregister FCM Token
```
DELETE /api/fcm/register?token=...
```

### Send Push Notification (Admin Only)
```
POST /api/fcm/send
Body: { userIds: string[], title: string, body: string, data?: object }
```

### Get Firebase Config (Public)
```
GET /api/firebase/config
Returns: { apiKey, authDomain, projectId, ... }
```

## Files Modified/Created

- `prisma/schema.prisma` - Added `FCMToken` model
- `lib/firebase/config.ts` - Firebase configuration management
- `lib/firebase/fcm-client.ts` - FCM push notification sending
- `lib/firebase/client.ts` - Frontend Firebase config
- `lib/notifications/push-notifications.ts` - Push notification helpers
- `lib/notifications/debateNotifications.ts` - Integrated push notifications
- `app/api/fcm/register/route.ts` - Token registration API
- `app/api/fcm/send/route.ts` - Send push notification API
- `app/api/firebase/config/route.ts` - Get Firebase config API
- `components/notifications/PushNotificationManager.tsx` - Frontend component
- `app/admin/settings/page.tsx` - Added Firebase config fields
- `app/layout.tsx` - Added PushNotificationManager component

