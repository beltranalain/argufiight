# Firebase Service Account - Organization Policy Restriction

## ❌ The Problem

You're seeing: **"Key creation is not allowed on this service account. Please check if service account key creation is restricted by organization policies."**

This means your Google Cloud organization has policies that prevent creating service account keys directly from Firebase Console.

## ✅ Solution Options

### Option 1: Use Google Cloud Console (Recommended)

Even though Firebase Console is blocked, you can create the key from Google Cloud Console:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/iam-admin/serviceaccounts?project=argu-fight
   - Or: https://console.cloud.google.com → Select project "argu-fight" → IAM & Admin → Service Accounts

2. **Find the Firebase Service Account:**
   - Look for: `firebase-adminsdk-fbsvc@argu-fight.iam.gserviceaccount.com`
   - Or any service account with "firebase-adminsdk" in the name

3. **Create Key:**
   - Click on the service account email
   - Go to the **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**
   - Select **JSON** format
   - Click **"Create"**
   - The JSON file will download

4. **Copy the JSON content** and paste it into Admin Settings

### Option 2: Use Application Default Credentials (If on Google Cloud)

If your app is running on Google Cloud (Cloud Run, App Engine, etc.), you can use Application Default Credentials instead:

1. The service account is automatically available
2. No need to download a key file
3. Update the code to use ADC instead of explicit credentials

**Note:** This only works if you're deploying to Google Cloud. Since you're using Vercel, this won't work.

### Option 3: Create a New Service Account

If the Firebase service account is restricted, create a new one:

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/iam-admin/serviceaccounts?project=argu-fight

2. **Create New Service Account:**
   - Click **"Create Service Account"**
   - Name: `firebase-messaging` (or any name)
   - Description: "For Firebase Cloud Messaging"
   - Click **"Create and Continue"**

3. **Grant Permissions:**
   - Add role: **"Firebase Cloud Messaging Admin"** or **"Firebase Admin SDK Administrator Service Agent"**
   - Click **"Continue"** → **"Done"**

4. **Create Key:**
   - Click on the new service account
   - Go to **"Keys"** tab
   - Click **"Add Key"** → **"Create new key"**
   - Select **JSON**
   - Download the file

5. **Use the JSON** in Admin Settings

### Option 4: Contact Organization Admin

If you have admin access to the Google Cloud organization:

1. **Check Organization Policies:**
   - Go to: https://console.cloud.google.com/iam-admin/orgpolicies
   - Look for: `iam.disableServiceAccountKeyCreation`
   - If it's enforced, you may need to:
     - Create an exception for your project
     - Or allow key creation for specific service accounts

2. **Or Create Exception:**
   - Go to Organization Policies
   - Find the policy blocking key creation
   - Add an exception for project `argu-fight`

## 🎯 Recommended: Use Google Cloud Console (Option 1)

**This is the easiest solution** - just use Google Cloud Console instead of Firebase Console to create the key.

### Quick Steps:

1. Visit: https://console.cloud.google.com/iam-admin/serviceaccounts?project=argu-fight
2. Click on `firebase-adminsdk-fbsvc@argu-fight.iam.gserviceaccount.com`
3. Go to "Keys" tab
4. Click "Add Key" → "Create new key" → JSON
5. Download and copy the JSON content
6. Paste into Admin Settings → Firebase Push Notifications → Service Account JSON

## ✅ After Getting the JSON

1. Copy the entire JSON file content
2. Go to Admin Dashboard → Settings
3. Scroll to "Firebase Push Notifications"
4. Paste into "Service Account JSON" field
5. Make sure VAPID Key is set
6. Click "Save Settings"

## 🔍 Verify It Works

After adding the Service Account JSON, push notifications should work. The code will use Firebase Admin SDK V1 API to send notifications.

