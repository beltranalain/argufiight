# User Passwords - Test Accounts

## ✅ Passwords Reset

Both test accounts have been reset with the password: **`password123`**

### Test Accounts:

1. **user@user.com**
   - Password: `password123`
   - Username: `user`

2. **apple@apple.com**
   - Password: `password123`
   - Username: `apple`

## 🔐 Login Instructions

You can now login with either account using:
- **Email**: `user@user.com` or `apple@apple.com`
- **Password**: `password123`

## 🔄 Reset Password (Command Line)

If you need to reset a password again:

```powershell
npx tsx scripts/reset-password.ts <email> <new-password>
```

Example:
```powershell
npx tsx scripts/reset-password.ts user@user.com newpassword123
```

## 🔑 Forgot Password Feature

A complete forgot password feature has been added:

1. **API Endpoint**: `/api/auth/forgot-password`
   - POST: Request password reset
   - PUT: Reset password with token
   - GET: Verify reset token

2. **Pages**:
   - `/forgot-password` - Request reset link
   - `/reset-password?token=xxx` - Reset password with token

3. **How it works**:
   - User enters email on forgot password page
   - System generates a reset token (valid for 1 hour)
   - In development: Token is logged to console
   - In production: Token would be sent via email
   - User clicks reset link and enters new password

## 📝 Notes

- Passwords are hashed using bcrypt
- Reset tokens expire after 1 hour
- Tokens are stored in memory (use Redis/database in production)
- The login page has a "Forgot password?" link


