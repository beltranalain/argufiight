# Firebase Service Account Setup Guide

## Problem
You're seeing the error: **"Firebase Service Account not configured"** when trying to send push notifications.

## Solution: Add Firebase Service Account JSON

### Step 1: Get Service Account JSON from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the **Gear icon** (⚙️) → **Project Settings**
4. Go to the **"Service Accounts"** tab
5. Click **"Generate new private key"** button
6. A JSON file will download (e.g., `your-project-firebase-adminsdk-xxxxx.json`)

### Step 2: Add to Admin Settings

1. Go to `https://www.argufight.com/admin/settings`
2. Scroll to **"Firebase Push Notifications"** section
3. Find the **"Service Account JSON"** textarea field
4. Open the downloaded JSON file in a text editor
5. **Copy the ENTIRE contents** of the JSON file (it should start with `{"type": "service_account", ...}`)
6. **Paste it** into the "Service Account JSON" textarea
7. Click **"Save Settings"** button at the bottom

### Step 3: Verify

1. After saving, try sending a test notification again
2. The error should be gone
3. Notifications should now send successfully

## What the Service Account JSON Looks Like

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Important Notes

- **Keep this JSON secure** - it has full access to your Firebase project
- **Never commit it to Git** - it's stored securely in the database
- **Only admins can see/edit it** - it's in the admin settings
- The JSON must be **valid JSON** - make sure you copy the entire file, including all quotes and brackets

## Alternative: OAuth2 Method

If your organization blocks service account keys, you can use OAuth2 instead:

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground/)
2. Configure OAuth2 credentials
3. Get Client ID, Client Secret, and Refresh Token
4. Add them to the OAuth2 fields in Admin Settings

## Troubleshooting

### Error: "Invalid JSON"
- Make sure you copied the **entire** JSON file
- Don't add or remove any characters
- Check for extra spaces or line breaks

### Error: "Service Account not configured" (after adding)
- Make sure you clicked **"Save Settings"**
- Refresh the page and check if the JSON is still there
- Try sending a test notification again

### Still Not Working?
- Check browser console (F12) for errors
- Verify the JSON is valid: paste it into [JSONLint](https://jsonlint.com/)
- Make sure the service account has proper permissions in Firebase Console
