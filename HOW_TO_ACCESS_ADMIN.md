# How to Access Admin Dashboard

## Step 1: Make Your User an Admin

You need to run a script to set your user as admin. Use your **email** or **username** that you signed up with.

### Option 1: Using PowerShell (Recommended)

```powershell
cd C:\Users\beltr\Honorable.AI

# Make yourself admin (replace with your email or username)
npx tsx scripts/make-admin.ts your-email@example.com

# Or use your username
npx tsx scripts/make-admin.ts your-username
```

### Option 2: Using npm script

```powershell
cd C:\Users\beltr\Honorable.AI

# Make yourself admin
npm run make-admin -- your-email@example.com
```

## Step 2: Access Admin Dashboard

After making yourself admin:

1. **Log out** (if you're logged in)
2. **Log back in** with your account
3. Go to: `https://honorable-ai.com/admin`

Or directly visit: `https://honorable-ai.com/admin/admin`

## Admin Routes Available

- `/admin` - Main admin dashboard
- `/admin/admin` - Full admin panel
- `/admin/users` - User management
- `/admin/debates` - Debate management
- `/admin/settings` - Settings (API keys, etc.)
- `/admin/moderation` - Moderation tools

## Remove Admin Access

If you need to remove admin access:

```powershell
npx tsx scripts/make-admin.ts your-email@example.com --remove
```

---

## Troubleshooting

**If you get "Forbidden" or redirected to home:**
- Make sure you ran the make-admin script
- Log out and log back in
- Check that your user has `isAdmin: true` in the database

**To check if you're admin:**
- Visit: `https://honorable-ai.com/api/auth/me`
- Should show: `"isAdmin": true`

