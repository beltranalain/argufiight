# Firebase Quick Setup - Next Steps

## ✅ What's Done

Your Firebase configuration has been automatically added to admin settings:
- ✅ API Key
- ✅ Auth Domain
- ✅ Project ID
- ✅ Storage Bucket
- ✅ Messaging Sender ID
- ✅ App ID

## ⚠️ What You Still Need

### 1. Get Server Key (Required)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **argu-fight**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Cloud Messaging** tab
5. Find **"Server key"** (or "Cloud Messaging API (Legacy)" key)
6. Copy the key (starts with `AAAA...`)

### 2. Get VAPID Key (Required for Web Push)

1. In the same **Cloud Messaging** tab
2. Scroll down to **"Web Push certificates"** section
3. If no key exists, click **"Generate key pair"**
4. Copy the **public key** (starts with `BK...`)

### 3. Add to Admin Settings

1. Go to **Admin Dashboard → Settings**
2. Scroll to **"Firebase Push Notifications"** section
3. Paste:
   - **Server Key** → `FIREBASE_SERVER_KEY` field
   - **VAPID Key** → `FIREBASE_VAPID_KEY` field
4. Click **"Save Settings"**

## 📝 Apply Database Migration

Run this to create the `fcm_tokens` table:

```bash
# Option 1: Using psql (if you have direct database access)
psql $DATABASE_URL -f prisma/migrations/20251210000000_add_fcm_tokens/migration.sql

# Option 2: Using Prisma (if migration system works)
npx prisma migrate deploy
```

## 🚫 Important: You DON'T Need Firebase Hosting

**You're using Vercel, not Firebase Hosting!**

The instructions you saw about:
- `firebase login`
- `firebase init`
- `firebase deploy`

**These are for Firebase Hosting, which you don't need.**

You only need:
- ✅ Firebase Cloud Messaging (FCM) - for push notifications
- ✅ Firebase config values - already added

**You're deploying to Vercel, not Firebase Hosting.**

## ✅ Testing

Once Server Key and VAPID Key are added:

1. **User visits site** → Browser asks "Allow notifications?"
2. **User clicks Allow** → Token registered automatically
3. **Start a debate** → When opponent submits, user gets push notification
4. **Check notification** → Should appear even if browser is closed

## 🎯 Summary

1. ✅ Firebase config added (done automatically)
2. ⏳ Get Server Key from Firebase Console
3. ⏳ Get VAPID Key from Firebase Console
4. ⏳ Add both to Admin Settings
5. ⏳ Apply database migration
6. ⏳ Test push notifications!

## 📚 Need Help?

- **Firebase Console**: https://console.firebase.google.com/project/argu-fight
- **Cloud Messaging Settings**: Project Settings → Cloud Messaging tab
- **Full Setup Guide**: See `FIREBASE_SETUP_GUIDE.md`

