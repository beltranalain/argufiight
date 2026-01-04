# Fix Admin Status - PowerShell Commands

## Step 1: Check User's Current Status

```powershell
npx tsx scripts/check-user-admin-status.ts basktballapp@gmail.com
```

This will show you:
- User ID
- Email
- Username
- `isAdmin` status

---

## Step 2: Fix Admin Status (Remove Admin)

**Option A: Use the fix script**
```powershell
npx tsx scripts/fix-user-admin-status.ts basktballapp@gmail.com false
```

**Option B: Use the existing remove-admin script**
```powershell
npx tsx scripts/remove-admin.ts basktballapp@gmail.com
```

---

## Step 3: Verify the Fix

After running the fix, check again:
```powershell
npx tsx scripts/check-user-admin-status.ts basktballapp@gmail.com
```

You should see `isAdmin: false` now.

---

## Complete Workflow (Copy & Paste)

```powershell
# 1. Check current status
npx tsx scripts/check-user-admin-status.ts basktballapp@gmail.com

# 2. Fix admin status (if needed)
npx tsx scripts/remove-admin.ts basktballapp@gmail.com

# 3. Verify fix
npx tsx scripts/check-user-admin-status.ts basktballapp@gmail.com
```

---

## After Running the Fix

1. **Refresh the browser page** (or log out and log back in)
2. The "Admin" button should disappear
3. The console should show the correct username instead of "admin"

---

**Note:** Make sure you're in the project directory (`c:\Users\beltr\Honorable.AI`) when running these commands!
