# Google OAuth - Temporarily Disabled

## Status
Google OAuth login has been **temporarily disabled** in the UI but all code and API keys are preserved for future implementation.

## What Was Done
1. **UI Button Hidden**: The "Continue with Google" button is commented out in `app/(auth)/login/page.tsx`
2. **Code Preserved**: All Google OAuth code remains intact:
   - `app/api/auth/google/route.ts` - OAuth initiation
   - `app/api/auth/google/callback/route.ts` - OAuth callback handler
   - `lib/auth/session.ts` - Session creation (including `createSessionWithoutCookie`)
   - All database schema fields for Google OAuth (googleId, googleEmail, etc.)

3. **API Keys Preserved**: 
   - Environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Admin settings: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if stored in database)

## Issues Encountered
1. **Invalid Client Error**: `invalid_client` (401) during token exchange
   - This indicates the Google OAuth credentials (client ID/secret) are invalid or misconfigured
   - Possible causes:
     - Client ID/Secret don't match
     - Redirect URI not configured in Google Cloud Console
     - Credentials expired or revoked
     - Wrong OAuth app being used

2. **Cookie Persistence**: Fixed cookie persistence issue by using `createSessionWithoutCookie()` and setting cookie only in redirect response

## To Re-enable Google OAuth

### Step 1: Verify Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Verify your OAuth 2.0 Client ID and Secret
4. Check Authorized redirect URIs include:
   - `https://www.argufight.com/api/auth/google/callback`
   - `https://argufight.vercel.app/api/auth/google/callback` (if using Vercel preview)

### Step 2: Verify Environment Variables
Check Vercel environment variables:
- `GOOGLE_CLIENT_ID` - Should match Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Should match Google Cloud Console  
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Public client ID (same as GOOGLE_CLIENT_ID)

### Step 3: Test Credentials
Test the credentials are valid by making a test OAuth request or checking Google Cloud Console logs.

### Step 4: Re-enable UI
Uncomment the Google login button in `app/(auth)/login/page.tsx` (lines 222-252)

## Files Modified
- `app/(auth)/login/page.tsx` - Google login button commented out
- `app/api/auth/google/callback/route.ts` - Added better error handling for invalid_client

## Files Preserved (Not Deleted)
- `app/api/auth/google/route.ts` - OAuth initiation endpoint
- `app/api/auth/google/callback/route.ts` - OAuth callback endpoint
- `lib/auth/session.ts` - Session creation functions
- All database schema fields for Google OAuth
- All environment variable configurations

## Next Steps When Ready
1. Verify Google OAuth credentials in Google Cloud Console
2. Test credentials are valid
3. Uncomment Google login button in `app/(auth)/login/page.tsx`
4. Test the full OAuth flow
5. Monitor Vercel logs for any errors

