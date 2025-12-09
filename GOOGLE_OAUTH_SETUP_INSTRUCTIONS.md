# Google OAuth Setup Instructions

## Overview

You need to configure Google OAuth in **TWO places**:

1. **Google Cloud Console** - Create the OAuth credentials
2. **Admin Dashboard** - Enter the credentials into the system

---

## Step 1: Configure in Google Cloud Console

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Configure OAuth Consent Screen (First Time Only)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required information:
   - **App name**: Argu Fight
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. **Scopes**: Click "Add or Remove Scopes" → Add:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. **Test users** (if in Testing mode): Add test emails
8. Click **Save and Continue**

### 1.3 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Web application
4. **Name**: Argu Fight OAuth
5. **Authorized JavaScript origins**:
   ```
   https://www.argufight.com
   ```
6. **Authorized redirect URIs**:
   ```
   https://www.argufight.com/api/auth/google/callback
   ```
7. Click **Create**
8. **Copy your credentials**:
   - **Client ID**: (looks like `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client Secret**: (looks like `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**⚠️ IMPORTANT**: Save these credentials! You'll need them in Step 2.

---

## Step 2: Configure in Admin Dashboard

### 2.1 Go to Admin Settings

1. Log in to your admin account
2. Navigate to **Admin** → **Settings** (`/admin/settings`)
3. Scroll down to the **"Google OAuth"** section

### 2.2 Enter Credentials

1. **Google Client ID**: 
   - Paste the Client ID you copied from Google Cloud Console
   - Example: `832076040240-ojhp14bosm1a9ibkct4nrbp4phjukbmk.apps.googleusercontent.com`

2. **Google Client Secret**:
   - Paste the Client Secret you copied from Google Cloud Console
   - Example: `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`
   - This field is password-protected and will be stored encrypted

### 2.3 Save Settings

1. Click **"Save Settings"** button at the bottom of the page
2. Wait for the success message
3. The credentials are now stored securely in your database

---

## Step 3: Test Google OAuth

1. Go to the login page: `/login`
2. Click **"Continue with Google"** button
3. You should be redirected to Google's sign-in page
4. After signing in, you should be redirected back to your site

---

## Troubleshooting

### Error: "Google OAuth not configured"

- **Solution**: Make sure you've entered both Client ID and Client Secret in Admin Settings and clicked "Save Settings"

### Error: "redirect_uri_mismatch"

- **Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
  ```
  https://www.argufight.com/api/auth/google/callback
  ```
  - No trailing slashes
  - Must be `https://` (not `http://`)
  - Must match your production domain

### Error: "invalid_client"

- **Solution**: 
  - Double-check that you copied the Client ID and Client Secret correctly
  - Make sure there are no extra spaces
  - Try regenerating the credentials in Google Cloud Console

### OAuth works locally but not in production

- **Solution**: Make sure you've added the production redirect URI to Google Cloud Console:
  ```
  https://www.argufight.com/api/auth/google/callback
  ```

---

## Quick Reference

**Where to configure:**
- ✅ **Google Cloud Console**: Create credentials
- ✅ **Admin Dashboard**: Enter credentials

**Credentials needed:**
- Client ID (from Google Cloud Console)
- Client Secret (from Google Cloud Console)

**Redirect URI to add:**
```
https://www.argufight.com/api/auth/google/callback
```

---

## Security Notes

- Client Secret is stored encrypted in the database
- Never share your Client Secret publicly
- If credentials are compromised, regenerate them in Google Cloud Console and update in Admin Settings

