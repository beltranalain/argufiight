# Firebase Service Account Setup (V1 API)

## ✅ What Changed

Firebase has **deprecated the Legacy API** (Server Key method). We've updated the code to use the **modern V1 API** with **Service Account** instead.

## 📋 What You Need

You already have:
- ✅ Firebase Config values (API Key, Auth Domain, Project ID, etc.)
- ✅ VAPID Key: `BN6Huso6iHfjB14YW42KyuNGlBPs18Kf9x_h2uzyiAxQVk2jwR1-oQaYKYU54aikqOtB4lKxi6-xLl0jjmTDx4g`

You need to get:
- ⏳ **Service Account JSON** (replaces Server Key)

## 🔥 How to Get Service Account JSON

### Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com
2. Select your project: **argu-fight**
3. Click the **gear icon (⚙️)** → **Project Settings**

### Step 2: Generate Service Account

1. Click the **"Service Accounts"** tab
2. Click **"Generate new private key"** button
3. A dialog will appear warning you to keep the key secret
4. Click **"Generate key"**
5. A JSON file will download automatically

### Step 3: Copy the JSON Content

1. Open the downloaded JSON file in a text editor
2. It will look like this:
```json
{
  "type": "service_account",
  "project_id": "argu-fight",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@argu-fight.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

3. **Copy the entire JSON content** (all of it)

### Step 4: Add to Admin Settings

1. Go to your site: **Admin Dashboard → Settings**
2. Scroll to **"Firebase Push Notifications"** section
3. Find **"Service Account JSON"** field (replaces "Server Key")
4. **Paste the entire JSON content** into the textarea
5. Make sure the VAPID Key is also filled in
6. Click **"Save Settings"**

## ✅ Quick Checklist

- [ ] Go to Firebase Console → Project Settings → Service Accounts
- [ ] Click "Generate new private key"
- [ ] Download the JSON file
- [ ] Copy entire JSON content
- [ ] Paste into Admin Settings → Firebase Push Notifications → Service Account JSON
- [ ] Verify VAPID Key is set: `BN6Huso6iHfjB14YW42KyuNGlBPs18Kf9x_h2uzyiAxQVk2jwR1-oQaYKYU54aikqOtB4lKxi6-xLl0jjmTDx4g`
- [ ] Click "Save Settings"

## 🔒 Security Note

- The Service Account JSON contains sensitive credentials
- It's stored **encrypted** in your database
- **Never** commit this file to Git
- **Never** share it publicly

## 🚀 After Setup

Once you've added the Service Account JSON:
1. Push notifications will work automatically
2. Users will be asked to allow notifications when they visit
3. Notifications will be sent when:
   - It's a user's turn in a debate
   - A new challenge is received
   - A debate is accepted
   - Any notification is created

## ❓ Troubleshooting

**Q: The Legacy API doesn't work anymore?**
A: Correct! That's why we switched to Service Account. The Legacy API was deprecated.

**Q: Do I need to enable anything in Google Cloud Console?**
A: No! Just generate the Service Account JSON from Firebase Console.

**Q: Can I use the same Service Account for other Firebase services?**
A: Yes! This Service Account can be used for all Firebase Admin SDK operations.

