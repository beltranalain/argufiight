# Push Notification Troubleshooting Guide

## Issue: Notifications are sent but not appearing on computer

If the admin settings show:
- ✅ Browser Permission: Granted
- ✅ FCM Token Registered: Yes
- ✅ Notification sent successfully (2 sent, 0 failed)

But you're not seeing notifications on your computer, follow these steps:

## Step 1: Check Browser Notification Settings

### Chrome/Edge:
1. Click the lock icon (🔒) or info icon (ℹ️) in the address bar
2. Find "Notifications" in the permissions list
3. Make sure it's set to **"Allow"** (not "Block" or "Ask")
4. If it's blocked, click it and change to "Allow"

### Firefox:
1. Click the lock icon in the address bar
2. Find "Notifications" → Set to "Allow"
3. Go to `about:preferences#privacy` → Permissions → Notifications → Settings
4. Make sure `argufight.com` is in the "Allowed" list

## Step 2: Check Windows Focus Assist (Do Not Disturb)

**Windows 10/11 has a feature called "Focus Assist" that can suppress notifications:**

1. Press `Windows Key + I` to open Settings
2. Go to **System** → **Focus Assist**
3. Make sure it's set to **"Off"** or **"Priority only"** (not "Alarms only")
4. If using "Priority only", add your browser to the priority list

**Quick Toggle:**
- Press `Windows Key + A` to open Action Center
- Look for "Focus Assist" button at the bottom
- Click to turn it off

## Step 3: Check Browser-Specific Notification Settings

### Chrome:
1. Go to `chrome://settings/content/notifications`
2. Make sure `argufight.com` is in the "Allowed" list
3. If it's blocked, remove it and re-allow when prompted

### Edge:
1. Go to `edge://settings/content/notifications`
2. Make sure `argufight.com` is in the "Allowed" list

## Step 4: Test Service Worker

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Service Workers** in the left sidebar
4. Find `firebase-messaging-sw.js`
5. Make sure it shows **"activated and is running"**
6. If it shows "redundant" or error, click **"Unregister"** and refresh the page

## Step 5: Check Browser Console for Errors

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for errors related to:
   - `firebase-messaging-sw.js`
   - `Push Notifications`
   - `FCM`
4. Common errors:
   - `Service worker registration failed` → Service worker file not accessible
   - `Failed to get FCM token` → VAPID key issue
   - `Notification permission denied` → Browser blocking notifications

## Step 6: Test with Browser Tab Closed

**Important:** Web push notifications are designed to work when the browser tab is **closed** or **inactive**.

1. Close the `argufight.com` tab completely
2. Send a test notification from admin settings
3. The notification should appear even with the tab closed

**Note:** If the tab is active and in focus, some browsers suppress notifications to avoid interrupting the user.

## Step 7: Check for Multiple FCM Tokens

The "2 sent, 0 failed" message suggests there might be 2 registered tokens:
1. One for your current browser/device
2. One for another device/browser session

**To check:**
1. Go to Admin Settings → Push Notifications
2. Look at the FCM token registration
3. If you see multiple tokens, you might be receiving notifications on a different device

## Step 8: Verify Service Worker is Receiving Messages

1. Open browser DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Click on `firebase-messaging-sw.js`
4. Check the console for messages like:
   - `[firebase-messaging-sw.js] Received background message`
   - `[firebase-messaging-sw.js] Firebase initialized successfully`

If you don't see these messages, the service worker might not be receiving notifications.

## Step 9: Test Notification Directly in Browser

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Run this command:
   ```javascript
   new Notification('Test Notification', {
     body: 'If you see this, notifications work!',
     icon: '/favicon.ico'
   })
   ```
4. If you see a notification, browser notifications work
5. If you get an error, notifications are blocked

## Step 10: Clear and Re-register

If nothing else works:

1. **Unregister Service Worker:**
   - DevTools → Application → Service Workers
   - Click "Unregister" on `firebase-messaging-sw.js`

2. **Clear Site Data:**
   - DevTools → Application → Storage
   - Click "Clear site data"

3. **Re-register:**
   - Refresh the page
   - Go to Admin Settings → Push Notifications
   - Click "Request Notification Permission" again
   - Click "Register FCM Token" again

## Common Issues and Solutions

### Issue: "Notifications work on mobile but not desktop"
**Solution:** Desktop browsers have stricter notification policies. Make sure Focus Assist is off and browser permissions are set correctly.

### Issue: "Notifications work when tab is closed but not when open"
**Solution:** This is normal behavior. Some browsers suppress notifications when the tab is active. The foreground message handler should show notifications, but it may be less reliable.

### Issue: "I see notifications in browser console but not as popups"
**Solution:** The service worker is receiving messages but not displaying them. Check that `showNotification` is being called in the service worker.

### Issue: "Notifications appear but disappear immediately"
**Solution:** Windows Focus Assist might be suppressing them. Turn off Focus Assist completely.

## Still Not Working?

If none of these steps work, check:

1. **Firewall/Antivirus:** Some security software blocks push notifications
2. **Browser Extensions:** Ad blockers or privacy extensions might block notifications
3. **Corporate/Network Policies:** If on a work network, IT policies might block notifications
4. **Browser Version:** Make sure you're using a recent version of Chrome/Edge/Firefox

## Diagnostic Information to Collect

If you need help, provide:
1. Browser name and version
2. Operating system version
3. Screenshot of Service Workers tab in DevTools
4. Console errors (if any)
5. Focus Assist status
6. Browser notification settings screenshot
