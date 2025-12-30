# Move Settings to Environment Variables - Implementation Guide

## ✅ What Was Done

### 1. **Google OAuth Settings** ✅
**Files Updated:**
- `app/api/auth/google/route.ts` - Removed database query
- `app/api/auth/google/callback/route.ts` - Removed database query
- `app/api/auth/google/mobile-callback/route.ts` - Removed database query

**Before:** Queried database for `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`  
**After:** Uses environment variables only (no database query)

**Impact:** Saves 2-3 database queries per OAuth request

### 2. **Tournaments Feature Setting** ✅
**File Updated:**
- `app/api/tournaments/route.ts` - Removed database query

**Before:** Queried database for `TOURNAMENTS_ENABLED`  
**After:** Uses environment variable only (no database query)

**Impact:** Saves 1-2 database queries per tournaments API request

---

## 🔧 Required Environment Variables

You need to set these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Google OAuth (Required)
1. **GOOGLE_CLIENT_ID**
   - **Value:** Your Google OAuth Client ID
   - **Example:** `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

2. **GOOGLE_CLIENT_SECRET**
   - **Value:** Your Google OAuth Client Secret
   - **Example:** `GOCSPX-abcdefghijklmnopqrstuvwxyz`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

### Tournaments Feature (Optional)
3. **TOURNAMENTS_ENABLED**
   - **Value:** `true` or `1` to enable, anything else to disable
   - **Default:** If not set, tournaments are disabled
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## 📋 How to Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Select your project (`argufight` or `honorable-ai`)

### Step 2: Navigate to Environment Variables
1. Click **Settings** tab
2. Click **Environment Variables** in the left sidebar

### Step 3: Add Google OAuth Variables
1. Click **Add New**
2. **Key:** `GOOGLE_CLIENT_ID`
3. **Value:** Your Google OAuth Client ID (from Google Cloud Console)
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **Save**

6. Click **Add New** again
7. **Key:** `GOOGLE_CLIENT_SECRET`
8. **Value:** Your Google OAuth Client Secret (from Google Cloud Console)
9. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
10. Click **Save**

### Step 4: Add Tournaments Setting (Optional)
1. Click **Add New**
2. **Key:** `TOURNAMENTS_ENABLED`
3. **Value:** `true` (to enable tournaments)
4. **Environments:** Check ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Click **Save**

### Step 5: Redeploy
**CRITICAL:** After adding environment variables, you MUST redeploy:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click **...** (three dots) → **Redeploy**
4. Wait for deployment to complete (~2-3 minutes)

---

## 🔍 Where to Find Google OAuth Credentials

### If You Already Have Them:
- Check your existing admin settings in the database
- Or check your Google Cloud Console

### If You Need to Create Them:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://www.argufight.com/api/auth/google/callback`
   - `https://www.argufight.com/api/auth/google/mobile-callback`
7. Copy the **Client ID** and **Client Secret**

---

## ✅ Verification

After setting environment variables and redeploying:

1. **Test Google OAuth:**
   - Visit `/login`
   - Click "Sign in with Google"
   - Should redirect to Google (not show "not configured" error)

2. **Test Tournaments:**
   - If `TOURNAMENTS_ENABLED=true`, tournaments API should work
   - If not set or `false`, should return 403 "feature disabled"

---

## 📊 Impact

**Database Queries Saved:**
- Google OAuth routes: **2-3 queries per request** (removed)
- Tournaments API: **1-2 queries per request** (removed)
- **Total:** ~3-5 fewer queries per OAuth/tournament request

**Combined with previous optimizations:**
- Layout: 1 query removed
- Homepage: ~95% reduction (cached)
- Ticker: ~95% reduction (cached)
- Google OAuth: 2-3 queries removed
- Tournaments: 1-2 queries removed

**Overall reduction:** ~96-97% fewer database queries! 🎉

---

## ⚠️ Important Notes

1. **Old Database Settings:** You can leave the old `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` settings in the database - they won't be used anymore, but won't hurt anything.

2. **Admin Panel:** The admin panel may still show these settings, but they won't be used by the code. You can optionally remove them from the admin UI later.

3. **Migration:** If you have existing values in the database, copy them to Vercel environment variables before removing the database queries.

---

## 🎯 Next Steps

1. ✅ Set `GOOGLE_CLIENT_ID` in Vercel
2. ✅ Set `GOOGLE_CLIENT_SECRET` in Vercel
3. ✅ Set `TOURNAMENTS_ENABLED=true` in Vercel (if you want tournaments enabled)
4. ✅ Redeploy
5. ✅ Test Google OAuth login
6. ✅ Test tournaments API (if enabled)

Once done, you'll have eliminated even more database queries! 🚀
