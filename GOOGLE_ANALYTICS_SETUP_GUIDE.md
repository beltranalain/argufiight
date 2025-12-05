# Google Analytics Service Account Setup Guide

## ⚠️ Important: What You Pasted is Wrong

You pasted the **gtag.js tracking script**, which is used to track website visitors. This is **NOT** what you need for the API integration.

## What You Need Instead

You need a **Service Account JSON file** from Google Cloud Console. This file looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Make sure you're using the project: **project-563658606120** (or select it from the dropdown)

### Step 2: Enable Google Analytics Data API

1. Go to **APIs & Services** → **Library**
2. Search for "Google Analytics Data API"
3. Click on it and press **"ENABLE"**

### Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"Service account"**
4. Fill in:
   - **Service account name**: `argufight-analytics` (or any name you prefer)
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for Argu Fight Google Analytics integration`
5. Click **"CREATE AND CONTINUE"**
6. Skip the optional steps (Grant access, Grant users access) and click **"DONE"**

### Step 4: Create and Download JSON Key

1. In the **Credentials** page, find your newly created service account
2. Click on the service account email (it will look like: `argufight-analytics@project-563658606120.iam.gserviceaccount.com`)
3. Go to the **"KEYS"** tab
4. Click **"ADD KEY"** → **"Create new key"**
5. Select **"JSON"** as the key type
6. Click **"CREATE"**
7. A JSON file will automatically download to your computer

### Step 5: Grant Access to Google Analytics Property

1. Go to **Google Analytics** (https://analytics.google.com/)
2. Click **Admin** (gear icon) in the bottom left
3. In the **Property** column, click **"Property access management"**
4. Click **"+"** → **"Add users"**
5. Enter the service account email (from Step 4, e.g., `argufight-analytics@project-563658606120.iam.gserviceaccount.com`)
6. Select role: **"Viewer"** (minimum required)
7. Click **"Add"**

### Step 6: Copy the JSON Content

1. Open the downloaded JSON file in a text editor (Notepad, VS Code, etc.)
2. **Select ALL** the content (Ctrl+A / Cmd+A)
3. **Copy** it (Ctrl+C / Cmd+C)
4. Go back to your Admin Settings page
5. **Paste** it into the "Google Analytics Service Account JSON" text area

### Step 7: Verify Property ID

Your Property ID should be: **514722979** (which you already have)

If you need to find it:
1. Go to Google Analytics
2. Click **Admin** → **Property Settings**
3. The Property ID is shown at the top

### Step 8: Test Connection

1. Click the **"Test Connection"** button next to Google Analytics
2. If successful, you'll see a green success message
3. If it fails, check:
   - The JSON is complete (starts with `{` and ends with `}`)
   - The service account email was added to GA4 with "Viewer" role
   - The Google Analytics Data API is enabled

## Common Mistakes to Avoid

❌ **Don't paste the gtag.js script** (what you did)
✅ **Do paste the Service Account JSON file**

❌ **Don't paste just the private key**
✅ **Do paste the entire JSON file**

❌ **Don't create an OAuth client ID**
✅ **Do create a Service Account**

## What the gtag.js Script is For

The gtag.js script you pasted is used to **track visitors on your website**. You would add it to your HTML pages like this:

```html
<!-- This goes in your HTML, NOT in the admin settings -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-41YDQDD6J3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-41YDQDD6J3');
</script>
```

But for the **API integration** (to fetch analytics data), you need the **Service Account JSON**.

## Need Help?

If you're still having issues:
1. Make sure the JSON file starts with `{"type": "service_account", ...}`
2. Verify the service account email has "Viewer" access in GA4
3. Check that the Google Analytics Data API is enabled
4. Try the "Test Connection" button to see specific error messages

