# Check All Users with Admin Status

## Check All Admin Users

Run this command to see ALL users who have admin privileges:

```powershell
npx tsx scripts/check-all-admin-users.ts
```

This will show:
- Total number of users
- How many have admin privileges
- List of all admin users with their details

---

## Important Notes

### 1. **This Fix Was Only for ONE User**
The fix you ran only affected `basktballapp@gmail.com`. If other users also have incorrect admin status, you'll need to fix them individually.

### 2. **Browser Cache Issue**
Even though the database is correct (`isAdmin: false`), the UI might still show admin labels because:
- **Browser cache** - The user data is cached in the browser
- **Session cache** - The session might have stale data

### 3. **How to Clear the Cache**
The user needs to:
1. **Hard refresh the page**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Or log out and log back in**
3. **Or clear browser cache** for the site

---

## If UI Still Shows Admin Labels

If the database shows `isAdmin: false` but the UI still shows admin labels:

1. **Check browser console** - Look for any errors
2. **Check the `/api/auth/me` response** - Open browser DevTools → Network → Find `/api/auth/me` request → Check the response
3. **Hard refresh** the page (`Ctrl + Shift + R`)
4. **Log out and log back in**

---

## Fix Multiple Users (if needed)

If you find other users with incorrect admin status, you can fix them:

```powershell
# Fix individual users
npx tsx scripts/remove-admin.ts user1@example.com
npx tsx scripts/remove-admin.ts user2@example.com

# Or use the fix script
npx tsx scripts/fix-user-admin-status.ts user1@example.com false
```
