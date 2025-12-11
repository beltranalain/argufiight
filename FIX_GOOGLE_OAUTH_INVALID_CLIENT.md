# Fix Google OAuth "invalid_client" Error

## Problem

Getting `invalid_client` (401) error when trying to login with Google. This means the **Client ID and Client Secret don't match**.

## Error Details

From logs:
```
OAuth Error Details: { 
  message: 'invalid_client', 
  code: 401, 
  clientId: '563658606120-shf21b7...', 
  redirectUri: 'https://www.argufight.com/api/auth/google/callback' 
}
```

## Root Cause

The Client Secret in your admin settings doesn't match the Client ID, or the Client Secret is incorrect/expired.

## Solution

### Step 1: Verify Client ID in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: **Argu Fight**
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID: `563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p`
5. **Click on it** to view details

### Step 2: Get the Correct Client Secret

In the Client ID details page:
1. Look for **"Client secrets"** section
2. You'll see a secret that starts with `GOCSPX-...`
3. **If you see "Viewing and downloading client secrets is no longer available"**:
   - Click **"+ Add secret"** button
   - Copy the NEW secret immediately (you can only see it once!)
   - This is your new Client Secret

### Step 3: Update Admin Settings

1. Go to **Admin Dashboard** → **Settings** (`/admin/settings`)
2. Scroll to **"Google OAuth"** section
3. **Verify Client ID** matches: `563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com`
4. **Update Client Secret** with the one from Step 2
5. Click **"Save Settings"**

### Step 4: Test Again

1. Go to `/login`
2. Click "Continue with Google"
3. Should work now! ✅

## Common Issues

### Issue 1: Secret Was Never Saved
- If you created the OAuth client but didn't save the secret, you need to create a new one
- Click "+ Add secret" in Google Cloud Console
- Copy it immediately and add to admin settings

### Issue 2: Secret Expired/Revoked
- If the secret was revoked or expired, create a new one
- Old secrets become invalid

### Issue 3: Wrong Client ID
- Make sure the Client ID in admin settings exactly matches Google Cloud Console
- No extra spaces or characters

## Verification

After updating, the error should change from:
- ❌ `invalid_client` (401)
- ✅ Should redirect to Google sign-in successfully

---

**Note**: The Client Secret can only be viewed once when created. If you lost it, you must create a new one.

