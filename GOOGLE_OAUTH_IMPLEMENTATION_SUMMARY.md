# Google OAuth Implementation Summary

## ✅ Implementation Complete

Google OAuth authentication has been successfully implemented for **advertisers and employees only**.

## What Was Implemented

### 1. Database Schema Updates
- Added Google OAuth fields to `User` model:
  - `googleId` (unique)
  - `googleEmail`
  - `googlePicture`
  - `googleAuthEnabled` (boolean)
- Made `passwordHash` optional to support OAuth users

### 2. API Routes Created
- **`/api/auth/google`** - Initiates Google OAuth flow
- **`/api/auth/google/callback`** - Handles OAuth callback and creates/updates user

### 3. Login Page Updates
- Added "Continue with Google" button (only shown for advertisers/employees)
- Added error handling for OAuth errors
- Integrated with existing email/password login

### 4. Security Features
- **Advertiser verification**: Only APPROVED advertisers can use Google OAuth
- **Employee verification**: Only users with `isAdmin: true` can use Google OAuth
- **Email matching**: Google email must match advertiser's `contactEmail` or employee's email
- **CSRF protection**: Uses `state` parameter in OAuth flow

### 5. User Flow Updates
- Advertiser login button on `/advertise` page redirects to `/login?userType=advertiser`
- Shows Google auth option when `userType=advertiser` or `userType=employee`

## Environment Variables Required

Add these to your `.env` and Vercel:

```env
GOOGLE_CLIENT_ID=832076040240-ojhp14bosm1a9ibkct4nrbp4phjukbmk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=832076040240-ojhp14bosm1a9ibkct4nrbp4phjukbmk.apps.googleusercontent.com
```

## Google Cloud Console Configuration

Make sure these redirect URIs are configured:
- `http://localhost:3000/api/auth/google/callback` (local)
- `https://www.argufight.com/api/auth/google/callback` (production)
- `https://argufight.vercel.app/api/auth/google/callback` (Vercel)

## Next Steps

1. **Run database migration**:
   ```bash
   npx prisma db push
   ```
   (You'll need to confirm when prompted about the unique constraint)

2. **Add environment variables** to Vercel:
   - Go to Vercel project → Settings → Environment Variables
   - Add all three Google OAuth variables
   - Redeploy

3. **Test the flow**:
   - Test with an approved advertiser email
   - Test with an employee/admin email
   - Verify redirects work correctly

## How It Works

1. **Advertiser/Employee clicks "Login"** → Redirects to `/login?userType=advertiser` or `/login?userType=employee`
2. **Login page shows Google auth button** (only for these user types)
3. **User clicks "Continue with Google"** → Redirects to Google OAuth
4. **User authenticates with Google** → Google redirects back to `/api/auth/google/callback`
5. **System verifies**:
   - For advertisers: Email matches approved advertiser's `contactEmail`
   - For employees: Email matches user with `isAdmin: true`
6. **User account created/updated** with Google OAuth info
7. **Session created** → User redirected to dashboard

## Files Modified

- `prisma/schema.prisma` - Added Google OAuth fields
- `app/api/auth/google/route.ts` - OAuth initiation
- `app/api/auth/google/callback/route.ts` - OAuth callback handler
- `app/(auth)/login/page.tsx` - Added Google auth button
- `app/advertise/page.tsx` - Updated login link
- `app/api/auth/login/route.ts` - Handle OAuth users
- `app/api/settings/route.ts` - Handle OAuth users in password change

## Notes

- Regular users (debaters) continue to use email/password only
- OAuth users cannot change password (they use Google auth)
- If an OAuth user tries to login with email/password, they get an error message
- New OAuth users automatically get FREE subscription and appeal limits

