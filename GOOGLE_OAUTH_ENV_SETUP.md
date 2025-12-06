# Google OAuth Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file (local) and Vercel environment variables (production):

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=832076040240-ojhp14bosm1a9ibkct4nrbp4phjukbmk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_GOOGLE_CLIENT_ID=832076040240-ojhp14bosm1a9ibkct4nrbp4phjukbmk.apps.googleusercontent.com
```

## Important Notes

1. **GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET**: Server-side only (never exposed to client)
2. **NEXT_PUBLIC_GOOGLE_CLIENT_ID**: Client-side (needed for OAuth flow initiation)
3. **Redirect URIs**: Make sure these are configured in Google Cloud Console:
   - `http://localhost:3000/api/auth/google/callback` (local)
   - `https://www.argufight.com/api/auth/google/callback` (production)
   - `https://argufight.vercel.app/api/auth/google/callback` (Vercel)

## Vercel Setup

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all three variables above
4. Make sure to set them for **Production**, **Preview**, and **Development** environments
5. Redeploy your application after adding the variables

## Testing

After setting up environment variables:
1. Test locally with `npm run dev`
2. Test the OAuth flow with an approved advertiser email
3. Test with an employee/admin email
4. Verify redirects work correctly

