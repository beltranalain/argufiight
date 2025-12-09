# How to Get Firebase Server Key

## The Issue

You can't see the Server Key because **"Cloud Messaging API (Legacy)" is disabled** in your Firebase Console.

## Solution: Enable Legacy API (Temporary)

**Note:** Firebase is deprecating the Legacy API, but it's still the easiest way to send push notifications from your server. You can use it until June 2024, then migrate to V1 API.

### Steps:

1. **In Firebase Console** → **Project Settings** → **Cloud Messaging** tab
2. Find **"Cloud Messaging API (Legacy)"** section
3. Click the **three dots (⋮)** on the right
4. Click **"Enable"**
5. The **Server key** will now appear below
6. Copy the Server key (starts with `AAAA...`)

### Alternative: Use V1 API with Service Account

If you prefer to use the modern V1 API instead:

1. Go to **Project Settings** → **Service Accounts** tab
2. Click **"Generate new private key"**
3. Download the JSON file
4. We'll need to update the code to use Service Account authentication

**For now, I recommend enabling Legacy API to get the Server Key - it's simpler and works immediately.**

## What You Have Now

✅ **VAPID Key**: `BN6Huso6iHfjB14YW42KyuNGlBPs18Kf9x_h2uzyiAxQVk2jwR1-oQaYKYU54aikqOtB4lKxi6-xLl0jjmTDx4g`
✅ **Sender ID**: `563658606120` (already in config)

## What You Need

⏳ **Server Key**: Enable Legacy API to see it, or use Service Account for V1 API

## Next Steps

1. Enable Legacy API in Firebase Console
2. Copy the Server Key
3. Add it to Admin Settings → Firebase Push Notifications → Server Key field
4. Add the VAPID Key to Admin Settings → Firebase Push Notifications → VAPID Key field
5. Save Settings

