# Fix Session Issue - PowerShell Commands

**Problem:** Still showing admin user data even after clearing browser cache.

---

## 🔴 The Real Issue

This is a **server-side session issue**, not just browser cache. The session in the database might be pointing to the wrong user.

---

## ✅ Solution Steps

### Step 1: Check User's Active Sessions

```powershell
npx tsx scripts/check-user-sessions.ts basktballapp@gmail.com
```

This will show:
- All active sessions for the user
- If there are any session conflicts
- Admin user's active sessions (which might be causing the issue)

### Step 2: Invalidate All Sessions (Force Logout)

```powershell
npx tsx scripts/invalidate-all-sessions.ts basktballapp@gmail.com
```

This will:
- Delete ALL sessions for the user
- Force them to log in again
- Create a fresh session

### Step 3: Also Invalidate Admin Sessions (if needed)

If the issue persists, also invalidate admin sessions:

```powershell
npx tsx scripts/invalidate-all-sessions.ts admin@argufight.com
```

### Step 4: Clear Browser Data Again

After invalidating sessions:
1. **Log out** (if you can)
2. **Clear all cookies** for `argufight.com`
3. **Clear localStorage**
4. **Close browser completely**
5. **Reopen browser**
6. **Log in again** as `basktballapp@gmail.com`

---

## 🚀 Complete Fix Workflow

```powershell
# 1. Check sessions
npx tsx scripts/check-user-sessions.ts basktballapp@gmail.com

# 2. Invalidate user's sessions
npx tsx scripts/invalidate-all-sessions.ts basktballapp@gmail.com

# 3. (Optional) Invalidate admin sessions too
npx tsx scripts/invalidate-all-sessions.ts admin@argufight.com
```

Then in browser:
1. Log out
2. Clear all cookies/localStorage
3. Close browser
4. Reopen and log in again

---

## ❌ Do NOT Redeploy

**Redeploying won't fix this!** This is a database/session issue, not a code issue. The sessions are stored in the database, so you need to invalidate them there.

---

## 📋 After Fixing

After invalidating sessions and re-logging in:
- ✅ Should show correct user ID: `200f925e-c782-435c-b347-ae99fb71868e`
- ✅ Should show correct username: `basktballapp`
- ✅ No "Admin" button
- ✅ Console log should show correct user
