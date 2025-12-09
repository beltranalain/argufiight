# How to Get Firebase Server Key - Step by Step

## ✅ Easiest Method: Firebase Console (Recommended)

**You don't need Google Cloud Console!** Use Firebase Console directly:

### Steps:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/argu-fight/settings/cloudmessaging
   - Or: https://console.firebase.google.com → Select "Argu Fight" → Settings (gear icon) → Cloud Messaging tab

2. **Enable Legacy API** (if not already enabled)
   - Scroll to **"Cloud Messaging API (Legacy)"** section
   - If it says "Disabled", click the **three dots (⋮)** on the right
   - Click **"Enable"**
   - Wait a few seconds for it to enable

3. **Get Server Key**
   - Once enabled, the **Server key** will appear below
   - It starts with `AAAA...`
   - Click to copy it

4. **Add to Admin Settings**
   - Go to your site: Admin Dashboard → Settings
   - Scroll to "Firebase Push Notifications"
   - Paste Server Key in "Server Key" field
   - Click "Save Settings"

## 🔄 Alternative: If Legacy API Won't Enable

If you can't enable Legacy API in Firebase Console:

### Option A: Use Service Account (V1 API)

1. Firebase Console → Project Settings → **Service Accounts** tab
2. Click **"Generate new private key"**
3. Download JSON file
4. We'll need to update code to use Service Account (more complex)

### Option B: Enable via Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=argu-fight
2. Click **"Enable"** button
3. Then go back to Firebase Console to get Server Key

### Option C: Use gcloud CLI

```bash
# Install gcloud CLI if needed
# Then run:
gcloud services enable fcm.googleapis.com --project=argu-fight
```

## 🎯 Quick Checklist

- [ ] Go to Firebase Console → Cloud Messaging tab
- [ ] Enable "Cloud Messaging API (Legacy)"
- [ ] Copy Server Key (starts with AAAA...)
- [ ] Add to Admin Settings → Firebase Push Notifications
- [ ] Save Settings
- [ ] Apply database migration
- [ ] Test push notifications!

## 💡 Pro Tip

**Firebase Console is easier than Google Cloud Console!** You can do everything from Firebase Console without needing Google Cloud Console at all.

