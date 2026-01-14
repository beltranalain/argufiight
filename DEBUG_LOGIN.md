# Debugging Login Issues

## Quick Check Commands

### 1. Check User Account Status
```powershell
npx tsx scripts/check-user-account.ts beltranalain@yahoo.com
```

This will show:
- ✅ If user exists
- ✅ If user has password set
- ✅ If user has Google-only auth
- ✅ If user is banned
- ✅ If user can login

### 2. Reset User Password (if needed)
```powershell
npx tsx scripts/reset-user-password.ts beltranalain@yahoo.com "NewPassword123!"
```

**WARNING:** This will overwrite the existing password!

### 3. Test Login After Reset
```powershell
.\QUICK_TEST_EXAMPLE.ps1
```

## Common Issues

### Issue 1: User Has Google-Only Auth
**Symptom:** `googleAuthEnabled: true` and `passwordHash: null`

**Solution:** 
- Either login via Google OAuth
- Or reset password to enable email/password login

### Issue 2: No Password Set
**Symptom:** `passwordHash: null` and `googleAuthEnabled: false`

**Solution:** Reset password using the script above

### Issue 3: Wrong Password
**Symptom:** User exists, has password, but login fails

**Solution:** Reset password to a known value

### Issue 4: User is Banned
**Symptom:** `isBanned: true`

**Solution:** Unban user in admin panel or database

## Manual Database Check

```sql
-- Check if user exists
SELECT id, email, username, 
       CASE WHEN password_hash IS NULL THEN 'No password' ELSE 'Has password' END as password_status,
       google_auth_enabled, is_banned
FROM users 
WHERE email = 'beltranalain@yahoo.com';

-- Check if user can login
SELECT 
  id,
  email,
  username,
  password_hash IS NOT NULL as has_password,
  google_auth_enabled,
  is_banned,
  CASE 
    WHEN is_banned THEN 'Cannot login - banned'
    WHEN google_auth_enabled AND password_hash IS NULL THEN 'Google-only auth'
    WHEN password_hash IS NULL THEN 'No password set'
    ELSE 'Can login with password'
  END as login_status
FROM users 
WHERE email = 'beltranalain@yahoo.com';
```

## Testing After Fix

Once you've verified/fixed the user account:

1. **Test login:**
   ```powershell
   .\QUICK_TEST_EXAMPLE.ps1
   ```

2. **Run full test:**
   ```powershell
   .\test-creator-network-flow.ps1 `
       -CreatorEmail "beltranalain@yahoo.com" `
       -CreatorPassword "YourActualPassword"
   ```

## Next Steps

1. Run `check-user-account.ts` to see what's wrong
2. If needed, reset password with `reset-user-password.ts`
3. Test login again
4. If still failing, check server logs for detailed error messages
