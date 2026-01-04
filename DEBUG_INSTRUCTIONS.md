# Debug Instructions - Admin User Bug

## 🔴 Critical: Check What `/api/auth/me` Returns

**This is the most important step!**

1. Open browser DevTools (`F12`)
2. Go to **Network** tab
3. Filter by: `auth/me`
4. Click on the `/api/auth/me` request
5. Go to **Response** tab
6. **Copy the entire response** and share it

**What to look for:**
- Does it show `"id": "3d780e1e-9cba-43af-be45-6e576182c3ad"` (admin)? → **Backend bug**
- Does it show the correct user ID? → **Frontend caching issue**

---

## 📋 Check Browser Console

After deploying the updated code, check the browser console for:

```
[useAuth] Received user data: { id: ..., email: ..., username: ..., isAdmin: ... }
[useAuth] Setting user state: { id: ..., email: ..., username: ..., isAdmin: ... }
```

**This will show:**
- What user data the frontend receives from `/api/auth/me`
- What user state is being set in React

---

## 📊 Check Vercel Logs

After deploying, check Vercel logs for:

1. `[API /auth/me]` logs - shows what the API endpoint is doing
2. `[verifySessionWithDb]` logs - shows which session is being looked up
3. `[Login]` logs - shows what user logged in

**These logs will show:**
- Which sessionToken is being used
- Which userId is found in the database
- Which user data is returned

---

## 🎯 Quick Test

1. **Open incognito/private window**
2. **Log in as `basktballapp@gmail.com`**
3. **Check console** - does it still show admin?

**If incognito shows admin:** → Backend bug (session lookup issue)  
**If incognito shows correct user:** → Browser cookie issue

---

## 🚀 What I Fixed

1. ✅ Added debug logging to `useAuth` hook
2. ✅ Added cache-busting to prevent stale responses
3. ✅ Added event listeners to refetch on login
4. ✅ Added debug logging to `/api/auth/me` endpoint
5. ✅ Added debug logging to `verifySessionWithDb`

**After deploying, the console and Vercel logs will show exactly what's happening!**
