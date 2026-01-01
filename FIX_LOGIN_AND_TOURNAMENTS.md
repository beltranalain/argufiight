# Fix Login Session Bug and Enable Tournaments

## 🐛 Issues Found

### 1. **Login Session Bug** ❌
**Problem:** All users logging in with Google OAuth are being redirected to the same account ("kubancane")

**Root Cause:** 
- Line 266 in `app/api/auth/google/callback/route.ts`
- Code was: `isAddingAccount = !!existingSession || addAccount`
- This means ANY existing session cookie triggers "account addition" mode
- It then restores the old session instead of using the new login
- Result: Everyone logs in as the same user

**Fix Applied:**
- Changed to: `isAddingAccount = addAccount` (only if explicitly requested)
- Only restore old session if user explicitly wants to add account
- Normal logins now use the new session correctly

### 2. **Tournaments Disabled** ❌
**Problem:** `/api/tournaments` returns 403 "Tournaments feature is disabled"

**Root Cause:**
- `TOURNAMENTS_ENABLED` environment variable not set in Vercel
- Code checks: `process.env.TOURNAMENTS_ENABLED === 'true'`
- If not set, tournaments are disabled

**Fix Needed:**
- Set `TOURNAMENTS_ENABLED=true` in Vercel environment variables

---

## ✅ Fixes Applied

### 1. **Login Session Bug** ✅
**File:** `app/api/auth/google/callback/route.ts`
- Fixed session restoration logic
- Only restores old session if explicitly adding account
- Normal logins now work correctly

### 2. **Tournaments** ⚠️
**Action Required:** Set environment variable in Vercel

---

## 🔧 How to Enable Tournaments

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Sign in and select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Tournament Setting
1. Click **Add New**
2. **Key:** `TOURNAMENTS_ENABLED`
3. **Value:** `true`
4. **Environments:** ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **...** → **Redeploy**
3. Wait for deployment to complete

---

## 📍 Where to Find Tournaments

### In Dashboard:
- **Location:** Dashboard homepage → "Tournaments" panel (left column, below Arena)
- **Link:** "View All" button → `/tournaments`

### Direct URL:
- `/tournaments` - Full tournaments page
- `/tournaments/create` - Create new tournament

### In Navigation:
- Tournaments panel is visible on dashboard
- Full page at `/tournaments`

---

## ✅ Summary

- **Login Bug:** ✅ Fixed - Normal logins now work correctly
- **Tournaments:** ⚠️ Need to set `TOURNAMENTS_ENABLED=true` in Vercel
- **After Fix:** Tournaments will be accessible at `/tournaments`

---

## 🧪 Test After Fix

1. **Test Login:**
   - Log out completely
   - Log in with Google OAuth
   - Should log in as the correct user (not "kubancane")

2. **Test Tournaments:**
   - After setting `TOURNAMENTS_ENABLED=true` and redeploying
   - Visit `/tournaments`
   - Should see tournaments page (not 403 error)

---

## ⚠️ Important Note

The login bug was caused by automatically restoring old sessions. This is now fixed - only explicit "add account" requests will restore old sessions. Normal logins will use the new session correctly.
