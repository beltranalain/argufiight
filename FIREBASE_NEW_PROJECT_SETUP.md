# Firebase Setup in New Google Cloud Project

## ✅ You've Created a New Project

Great! Now let's set up Firebase and get the service account JSON.

## 📋 Step-by-Step Setup

### Step 1: Create Firebase Project (or Link Existing)

**Option A: Create New Firebase Project**

1. Go to: https://console.firebase.google.com
2. Click **"Add project"** (or "Create a project")
3. Enter project name: `argu-fight-push` (or any name)
4. Click **"Continue"**
5. **Important:** When asked "Do you want to set up Google Analytics?", you can choose **"Not now"** (or enable it if you want)
6. Click **"Create project"**
7. Wait for project to be created
8. Click **"Continue"**

**Option B: Link to Existing Firebase Project**

If you want to use your existing Firebase project but with a different Google Cloud project:
1. This is more complex - you'd need to change the Google Cloud project in Firebase settings
2. **Recommended:** Just create a new Firebase project for push notifications

### Step 2: Add Web App to Firebase

1. In Firebase Console, you'll see your project dashboard
2. Click the **web icon (`</>`)** to add a web app
3. Register app with nickname: **"Argu Fight Web"**
4. **Copy all the config values** - you'll need them:
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID

### Step 3: Enable Cloud Messaging

1. In Firebase Console → Your project
2. Click **gear icon (⚙️)** → **Project Settings**
3. Go to **"Cloud Messaging"** tab
4. Scroll to **"Web Push certificates"** section
5. Click **"Generate key pair"** if no key exists
6. **Copy the VAPID key** (starts with `BK...` or `BN...`)

### Step 4: Get Service Account JSON

1. Still in Firebase Console → **Project Settings**
2. Click **"Service Accounts"** tab
3. Click **"Generate new private key"** button
4. A dialog will appear - click **"Generate key"**
5. **A JSON file will download** - this should work now since it's a new project!

### Step 5: Copy Service Account JSON

1. Open the downloaded JSON file
2. **Copy the entire JSON content** (all of it)
3. It should look like:
```json
{
  "type": "service_account",
  "project_id": "your-new-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-new-project.iam.gserviceaccount.com",
  ...
}
```

### Step 6: Add to Admin Settings

1. Go to your site: **Admin Dashboard → Settings**
2. Scroll to **"Firebase Push Notifications"** section
3. **Update all Firebase config values** with the new project's values:
   - Firebase API Key (from Step 2)
   - Auth Domain (from Step 2)
   - Project ID (from Step 2)
   - Storage Bucket (from Step 2)
   - Messaging Sender ID (from Step 2)
   - App ID (from Step 2)
4. **Paste Service Account JSON** (from Step 5) into "Service Account JSON" field
5. **Paste VAPID Key** (from Step 3) into "VAPID Key" field
6. Click **"Save Settings"**

## ⚠️ Important Notes

1. **You'll have TWO Firebase projects now:**
   - Original: `argu-fight` (for other features)
   - New: `argu-fight-push` (for push notifications)

2. **This is fine!** Push notifications will work from the new project.

3. **Make sure to use the NEW project's config values** in Admin Settings, not the old ones.

## ✅ Quick Checklist

- [ ] Create Firebase project (or link to new Google Cloud project)
- [ ] Add web app → Copy all 6 config values
- [ ] Generate VAPID key → Copy it
- [ ] Generate Service Account JSON → Copy entire JSON
- [ ] Update Admin Settings with NEW project's values
- [ ] Paste Service Account JSON
- [ ] Paste VAPID Key
- [ ] Save Settings

## 🚀 After Setup

Once you've added everything:
1. Push notifications will work from the new project
2. Users will be asked to allow notifications
3. Notifications will be sent when it's their turn, etc.

