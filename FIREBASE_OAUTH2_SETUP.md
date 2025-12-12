# Firebase Push Notifications - OAuth2 Setup (No Service Account Key Needed)

## ✅ Solution: Use OAuth2 Instead of Service Account

Since organization policies block service account key creation, we'll use **OAuth2** to authenticate with Firebase.

## 📋 What You Need

You already have:
- ✅ Firebase Config values (from your new project)
- ✅ VAPID Key: `BFrBi0pl4hi5VynZJg1WU0cNsnxHUZLukxxew4Xie3iVsYw2KBovsh7pkapT3swN21elF01vibGDWQNe0QK2my0`

You need to get:
- ⏳ **OAuth2 Client ID** (for Firebase)
- ⏳ **OAuth2 Client Secret** (for Firebase)
- ⏳ **OAuth2 Refresh Token** (for Firebase)

## 🔥 Step-by-Step: Get OAuth2 Credentials

### Step 1: Create OAuth2 Credentials in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=argu-fight-push-6c777
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

### Step 2: Configure OAuth Consent Screen (If First Time)

If you haven't set up OAuth consent screen:
1. You'll be prompted to configure it
2. Choose **"External"** (unless you have a Google Workspace)
3. Fill in:
   - App name: **"Argu Fight Push Notifications"**
   - User support email: Your email
   - Developer contact: Your email
4. Click **"Save and Continue"**
5. Skip scopes (click "Save and Continue")
6. Add test users if needed (click "Save and Continue")
7. Review and go back to dashboard

### Step 3: Create OAuth2 Client ID

1. Back at Credentials page
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **"Firebase Push Notifications"**
5. Authorized redirect URIs: Add:
   - `http://localhost:3000` (for testing)
   - `https://www.argufight.com` (your production domain)
6. Click **"Create"**
7. **Copy the Client ID and Client Secret** (you'll see them once)

### Step 4: Get Refresh Token

**Option A: Using OAuth2 Playground (Easiest)**

1. Go to: https://developers.google.com/oauthplayground/
2. Click the gear icon (⚙️) in top right
3. Check **"Use your own OAuth credentials"**
4. Enter your **Client ID** and **Client Secret**
5. In left panel, find **"Firebase Cloud Messaging API v1"**
6. Check the scope: `https://www.googleapis.com/auth/firebase.messaging`
7. Click **"Authorize APIs"**
8. Sign in and grant permissions
9. Click **"Exchange authorization code for tokens"**
10. **Copy the "Refresh token"** (this is what you need!)

**Option B: Using a Script (More Complex)**

I can create a script to help you get the refresh token if needed.

### Step 5: Add to Admin Settings

1. Go to: **Admin Dashboard → Settings**
2. Scroll to **"Firebase Push Notifications"** section
3. Fill in:
   - All Firebase config values (from your new project)
   - **OAuth2 Client ID** (from Step 3)
   - **OAuth2 Client Secret** (from Step 3)
   - **OAuth2 Refresh Token** (from Step 4)
   - **VAPID Key**: `BFrBi0pl4hi5VynZJg1WU0cNsnxHUZLukxxew4Xie3iVsYw2KBovsh7pkapT3swN21elF01vibGDWQNe0QK2my0`
4. Click **"Save Settings"**

## ✅ What This Does

- Uses OAuth2 to get access tokens (no service account key needed!)
- Sends push notifications via Firebase REST API
- Automatically refreshes tokens when they expire
- Works around organization policy restrictions

## 🎯 Quick Checklist

- [ ] Create OAuth2 Client ID in Google Cloud Console
- [ ] Get Client ID and Client Secret
- [ ] Get Refresh Token using OAuth Playground
- [ ] Add all to Admin Settings → Firebase Push Notifications
- [ ] Save Settings

## 📝 Current Firebase Config (Your New Project)

Use these values in Admin Settings:
- **API Key**: `AIzaSyDcTZDwXGDu5422rB1DTU4JPtirsbUXnzM`
- **Auth Domain**: `argu-fight-push-6c777.firebaseapp.com`
- **Project ID**: `argu-fight-push-6c777`
- **Storage Bucket**: `argu-fight-push-6c777.firebasestorage.app`
- **Messaging Sender ID**: `72141166930`
- **App ID**: `1:72141166930:web:34bb39e093cb4c63fcc28b`
- **VAPID Key**: `BFrBi0pl4hi5VynZJg1WU0cNsnxHUZLukxxew4Xie3iVsYw2KBovsh7pkapT3swN21elF01vibGDWQNe0QK2my0`

