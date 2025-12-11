# Update Google Client Secret in Admin Settings

## ✅ New Client Secret

You've created a new Client Secret:
```
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
```

## 📋 Next Steps

### Step 1: Go to Admin Settings

1. Go to: https://www.argufight.com/admin/settings
2. Scroll down to **"Google OAuth"** section

### Step 2: Update Client Secret

1. Find the **"Google Client Secret"** field
2. Paste the new secret: `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`
3. Make sure the **Client ID** is: `563658606120-shf21b7km8jsfp5stgicg6q75hdvcr0p.apps.googleusercontent.com`
4. Click **"Save Settings"**

### Step 3: Test Google Login

1. Go to: https://www.argufight.com/login
2. Click **"Continue with Google"**
3. Should work now! ✅

## ⚠️ Important Notes

- You have **2 client secrets** in Google Cloud Console
- The **NEW one** (created Dec 11) is the one you should use: `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`
- The old one (created Dec 8) can be disabled/deleted after confirming the new one works
- Make sure there are **no extra spaces** when pasting

## 🔍 Verification

After saving:
- The `invalid_client` error should be gone
- Google login should redirect to Google sign-in
- After signing in, you should be logged in successfully

---

**Status**: Ready to update! Just paste the secret in admin settings and save.

