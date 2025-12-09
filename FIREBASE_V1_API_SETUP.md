# Firebase V1 API Setup (Alternative to Legacy API)

## Problem: Google Cloud Console Won't Load

If Google Cloud Console is showing "Failed to load" errors, you can use the **modern V1 API** instead of the Legacy API. This is actually the **recommended approach** by Firebase!

## Solution: Use Service Account (V1 API)

### Step 1: Get Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/project/argu-fight)
2. Click **Project Settings** (gear icon)
3. Go to **Service Accounts** tab
4. Click **"Generate new private key"**
5. Click **"Generate key"** in the popup
6. A JSON file will download (e.g., `argu-fight-firebase-adminsdk-xxxxx.json`)

### Step 2: Add Service Account to Admin Settings

**Option A: Via Admin Dashboard (Recommended)**

1. Open the downloaded JSON file in a text editor
2. Copy the entire JSON content
3. Go to your site: **Admin Dashboard → Settings**
4. Scroll to **"Firebase Push Notifications"** section
5. Add a new field (or we can add it to the form):
   - **Field Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the entire JSON content
6. Click **"Save Settings"**

**Option B: Via Script**

1. Save the JSON file somewhere accessible
2. Run:
   ```bash
   # Read JSON file and add to database
   npx tsx scripts/add-service-account.ts <path-to-json-file>
   ```

### Step 3: Code Already Updated!

The code has been updated to:
- ✅ Try V1 API first (Service Account)
- ✅ Fall back to Legacy API (Server Key) if V1 fails
- ✅ Work with either method

## Benefits of V1 API

- ✅ **Modern & Recommended** by Firebase
- ✅ **No Google Cloud Console needed** - everything in Firebase Console
- ✅ **More secure** - uses OAuth2 tokens
- ✅ **No expiration issues** - tokens auto-refresh

## What You Need

- ✅ **Service Account JSON** - Download from Firebase Console
- ✅ **Add to Admin Settings** - Store the JSON
- ✅ **That's it!** - Code handles the rest

## Comparison

| Method | How to Get | Where to Add |
|--------|-----------|--------------|
| **Legacy API** | Enable in Google Cloud Console (not working) | Server Key field |
| **V1 API** | Download from Firebase Console ✅ | Service Account JSON field |

## Next Steps

1. Download Service Account JSON from Firebase Console
2. Add it to Admin Settings (we'll add the field to the form)
3. Test push notifications!

The code will automatically use V1 API if Service Account is configured, otherwise it falls back to Legacy API.

