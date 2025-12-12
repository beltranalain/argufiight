# Firebase Push Notifications - What You Need

## 📋 Summary

You need **8 values** from Firebase Console to enable push notifications. All of these can be found in one place: **Firebase Console → Project Settings**.

---

## 🔥 Step-by-Step Guide

### Step 1: Go to Firebase Console

1. Visit: https://console.firebase.google.com
2. Select your project (or create one if you don't have one)
3. Click the **gear icon (⚙️)** → **Project Settings**

### Step 2: Get Firebase Config Values (6 values)

1. Scroll down to **"Your apps"** section
2. If you don't have a web app yet:
   - Click the **web icon (`</>`)** to add a web app
   - Register it with a nickname (e.g., "Argu Fight Web")
3. You'll see a config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

**Copy these 6 values:**
- ✅ **Firebase API Key** → `apiKey`
- ✅ **Auth Domain** → `authDomain`
- ✅ **Project ID** → `projectId`
- ✅ **Storage Bucket** → `storageBucket`
- ✅ **Messaging Sender ID** → `messagingSenderId`
- ✅ **App ID** → `appId`

### Step 3: Get Service Account JSON (Replaces Server Key)

**Note:** Firebase deprecated the Legacy API (Server Key). We now use Service Account JSON instead.

1. In the same **Project Settings** page, click the **"Service Accounts"** tab
2. Click **"Generate new private key"** button
3. A dialog will appear - click **"Generate key"**
4. A JSON file will download automatically
5. **Open the JSON file** and copy its entire contents

### Step 4: Get VAPID Key (for Web Push)

1. Still in the **Cloud Messaging** tab
2. Scroll to **"Web Push certificates"** section
3. If no key exists:
   - Click **"Generate key pair"**
   - A key pair will be generated
4. **Copy the public key** (starts with `BK...` or `BN...`)
   - This is your **VAPID Key**

---

## 📝 Add to Admin Settings

1. Go to your site: **Admin Dashboard → Settings**
2. Scroll to **"Firebase Push Notifications"** section
3. Paste all values:
   - Firebase API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
   - **Service Account JSON** (textarea - paste entire JSON file content)
   - **VAPID Key**
4. Click **"Save Settings"**

---

## ✅ Quick Checklist

- [ ] Firebase API Key (`AIza...`)
- [ ] Auth Domain (`your-project.firebaseapp.com`)
- [ ] Project ID (`your-project-id`)
- [ ] Storage Bucket (`your-project.appspot.com`)
- [ ] Messaging Sender ID (`123456789`)
- [ ] App ID (`1:123456789:web:...`)
- [ ] Service Account JSON (entire JSON file content) - from Service Accounts tab
- [ ] VAPID Key (`BK...` or `BN...`) - from Cloud Messaging tab

---

## 🎯 Where to Find Everything

**All in one place:**
- **Firebase Console** → **Project Settings** → **General tab** (for config values)
- **Firebase Console** → **Project Settings** → **Service Accounts tab** (for Service Account JSON)
- **Firebase Console** → **Project Settings** → **Cloud Messaging tab** (for VAPID Key)

**Direct links:**
- Config values: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general
- Cloud Messaging: https://console.firebase.google.com/project/YOUR_PROJECT/settings/cloudmessaging

---

## ⚠️ Important Notes

1. **Service Account JSON** is sensitive - keep it secret (it's stored encrypted in your database)
2. **VAPID Key** is the public key - safe to expose (it's used client-side)
3. **Legacy API (Server Key) is deprecated** - we now use Service Account JSON instead
4. All values are required except Storage Bucket (optional but recommended)

---

## 🚀 After Adding Credentials

Once you've added all credentials:
1. Users will be asked to allow notifications when they visit your site
2. Push notifications will automatically be sent when:
   - It's a user's turn in a debate
   - A new challenge is received
   - A debate is accepted
   - Any notification is created

---

**Need help?** Check the setup instructions in Admin Settings → Firebase Push Notifications section.

