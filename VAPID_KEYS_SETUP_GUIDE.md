# VAPID Keys Setup Guide for Web Push Notifications

## What are VAPID Keys?

**VAPID** (Voluntary Application Server Identification) keys are used for web push notifications. They allow your server to send push notifications to browsers without requiring a Firebase service account.

## Why Use VAPID Instead of Firebase?

- ✅ **No Firebase service account required** - Works without organizational policies blocking key generation
- ✅ **Standard Web Push Protocol** - Works with all modern browsers
- ✅ **Free** - No cost, no limits
- ✅ **Simple setup** - Just generate keys and add them to admin settings

## How to Generate VAPID Keys

### Option 1: Using Node.js (Recommended)

1. **Install web-push globally** (if not already installed):
   ```bash
   npm install -g web-push
   ```

2. **Generate VAPID keys**:
   ```bash
   web-push generate-vapid-keys
   ```

3. **You'll get output like this**:
   ```
   Public Key:
   BEl62iUYgUivxIkv69yViEuiBIa40HI8vFwjfK8b8Q...
   
   Private Key:
   qrKjXy5Y8XZ0jvK8b8Q...
   ```

4. **Copy both keys** - you'll need them in the next step

### Option 2: Using Online Generator

1. Go to https://web-push-codelab.glitch.me/
2. Click "Generate VAPID Keys"
3. Copy the **Public Key** and **Private Key**

### Option 3: Using npm script (if web-push is in your project)

1. Run:
   ```bash
   npx web-push generate-vapid-keys
   ```

2. Copy the generated keys

## How to Add VAPID Keys to Admin Settings

1. **Log in as admin** to your site
2. Go to **Admin Dashboard → Settings**
3. Scroll to **"Push Notifications"** section
4. Find the fields:
   - **VAPID Public Key** - Paste your public key here
   - **VAPID Private Key** - Paste your private key here
5. Click **"Save Settings"**

## Important Notes

- ⚠️ **Keep your private key secret** - Never share it publicly or commit it to version control
- ✅ **Public key is safe** - Can be shared with frontend code
- 🔄 **One key pair per domain** - Generate new keys if you change domains
- 📝 **Contact email** - The system uses `admin@argufight.com` as the contact email (can be changed in code)

## Testing

After adding VAPID keys:

1. Go to **Admin Settings → Push Notifications**
2. Click **"Test Push Notification"**
3. You should receive a notification if:
   - You've granted notification permissions
   - Your browser supports web push
   - VAPID keys are correctly configured

## Troubleshooting

### "VAPID keys not configured" error
- Make sure both public and private keys are added in admin settings
- Check that keys were copied completely (no extra spaces)
- Try regenerating keys if issues persist

### Notifications not working
- Check browser notification permissions
- Ensure service worker is registered
- Check browser console for errors
- Verify VAPID keys are correct

## Security

- Private key should only be stored on the server
- Never expose private key in frontend code
- Rotate keys if compromised
- Use environment variables for production (optional)
