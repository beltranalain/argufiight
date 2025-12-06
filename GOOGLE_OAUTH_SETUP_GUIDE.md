# Google OAuth Setup Guide for Advertisers and Employees

This guide will walk you through setting up Google OAuth authentication specifically for **advertisers and employees only**. Regular users will continue to use email/password authentication.

## Prerequisites

- Google Cloud Console account
- Access to your Vercel/production environment variables
- Admin access to your database

---

## Step 1: Set Up Google OAuth Credentials

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Configure OAuth Consent Screen (First Time Only)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required information:
   - **App name**: Argu Fight
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **Save and Continue**
5. **Scopes**: Click "Add or Remove Scopes" → Add:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. **Test users** (if in Testing mode): Add test emails
8. Click **Save and Continue**

### 1.3 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type**: Web application
4. **Name**: Argu Fight OAuth
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://www.argufight.com
   https://argufight.vercel.app
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/google/callback
   https://www.argufight.com/api/auth/google/callback
   https://argufight.vercel.app/api/auth/google/callback
   ```
7. Click **Create**
8. **Copy your credentials**:
   - **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Install Required Packages

```bash
npm install google-auth-library
```

---

## Step 3: Update Database Schema

Add Google OAuth fields to the User model:

```prisma
model User {
  // ... existing fields ...
  
  // Google OAuth fields
  googleId          String?  @unique @map("google_id")
  googleEmail       String?  @map("google_email")
  googlePicture      String?  @map("google_picture")
  googleAuthEnabled Boolean  @default(false) @map("google_auth_enabled")
}
```

Then run:
```bash
npx prisma migrate dev --name add_google_oauth_fields
npx prisma generate
```

---

## Step 4: Add Environment Variables

Add to your `.env` file (local) and Vercel environment variables (production):

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
```

**Important**: 
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are server-side only
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is needed for the client-side OAuth flow

---

## Step 5: Create Google OAuth API Routes

### 5.1 Create `/api/auth/google/route.ts`

This route initiates the Google OAuth flow:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    )
  }

  // Get the intended redirect URL from query params (for advertisers/employees)
  const searchParams = request.nextUrl.searchParams
  const returnTo = searchParams.get('returnTo') || '/'
  const userType = searchParams.get('userType') // 'advertiser' or 'employee'

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({ returnTo, userType }), // Store return URL and user type
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(authUrl)
}
```

### 5.2 Create `/api/auth/google/callback/route.ts`

This route handles the OAuth callback:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) {
      return NextResponse.redirect('/login?error=oauth_failed')
    }

    // Parse state to get return URL and user type
    let returnTo = '/'
    let userType = null
    if (state) {
      try {
        const stateData = JSON.parse(state)
        returnTo = stateData.returnTo || '/'
        userType = stateData.userType
      } catch (e) {
        // Invalid state, use defaults
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect('/login?error=oauth_not_configured')
    }

    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.id_token) {
      return NextResponse.redirect('/login?error=oauth_failed')
    }

    // Verify and decode the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.redirect('/login?error=oauth_failed')
    }

    const googleId = payload.sub
    const googleEmail = payload.email
    const googlePicture = payload.picture
    const googleName = payload.name

    if (!googleEmail) {
      return NextResponse.redirect('/login?error=no_email')
    }

    // Check if user exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    })

    // If no user with Google ID, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: googleEmail.toLowerCase() },
      })
    }

    // Verify user type restrictions
    if (userType === 'advertiser') {
      // Check if user is an advertiser
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: googleEmail.toLowerCase() },
      })
      if (!advertiser || advertiser.status !== 'APPROVED') {
        return NextResponse.redirect('/login?error=not_approved_advertiser')
      }
    } else if (userType === 'employee') {
      // Check if user is an employee/admin
      if (!user?.isAdmin) {
        return NextResponse.redirect('/login?error=not_employee')
      }
    }

    // If user doesn't exist, create new user (only for advertisers/employees)
    if (!user) {
      if (userType === 'advertiser') {
        // Create user account for advertiser
        user = await prisma.user.create({
          data: {
            email: googleEmail.toLowerCase(),
            username: googleName || googleEmail.split('@')[0],
            avatarUrl: googlePicture,
            googleId,
            googleEmail: googleEmail.toLowerCase(),
            googlePicture,
            googleAuthEnabled: true,
            passwordHash: '', // No password needed for OAuth users
          },
        })
      } else {
        return NextResponse.redirect('/login?error=user_not_found')
      }
    } else {
      // Update existing user with Google OAuth info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          googleEmail: googleEmail.toLowerCase(),
          googlePicture,
          googleAuthEnabled: true,
        },
      })
    }

    // Create session
    await createSession(user.id)

    // Redirect based on user type
    if (user.isAdmin) {
      return NextResponse.redirect('/admin')
    } else if (userType === 'advertiser') {
      return NextResponse.redirect('/advertiser/dashboard')
    } else {
      return NextResponse.redirect(returnTo)
    }
  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect('/login?error=oauth_error')
  }
}
```

---

## Step 6: Update Login Page

Modify `/app/(auth)/login/page.tsx` to show Google auth button for advertisers/employees:

```typescript
// Add this function to check if user should see Google auth
const shouldShowGoogleAuth = () => {
  // Check if there's a query param indicating advertiser/employee login
  const searchParams = new URLSearchParams(window.location.search)
  const userType = searchParams.get('userType')
  return userType === 'advertiser' || userType === 'employee'
}

// Add Google auth button in the login form:
{shouldShowGoogleAuth() && (
  <>
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-bg-tertiary"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-bg-secondary text-text-secondary">Or continue with</span>
      </div>
    </div>

    <Button
      type="button"
      variant="secondary"
      className="w-full py-3.5 text-base flex items-center justify-center gap-3"
      onClick={() => {
        const userType = new URLSearchParams(window.location.search).get('userType')
        window.location.href = `/api/auth/google?userType=${userType || 'advertiser'}&returnTo=${encodeURIComponent(window.location.pathname)}`
      }}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </Button>
  </>
)}
```

---

## Step 7: Update Advertiser Login Flow

Update `/app/advertise/page.tsx` to redirect to login with `userType=advertiser`:

```typescript
// In the login button/link:
<Button variant="primary" onClick={() => router.push('/login?userType=advertiser')}>
  Login
</Button>
```

---

## Step 8: Update Admin/Employee Login Flow

For admin pages, you can add a Google auth option or redirect to login with `userType=employee`.

---

## Step 9: Security Considerations

1. **Email Verification**: Only allow Google OAuth if the email matches an approved advertiser or employee
2. **State Parameter**: Always use the `state` parameter to prevent CSRF attacks
3. **HTTPS Only**: Ensure OAuth callbacks only work over HTTPS in production
4. **Token Storage**: Never store Google tokens in client-side storage
5. **Session Management**: Use your existing session system (JWT + database)

---

## Step 10: Testing

### Local Testing:
1. Set up OAuth credentials with `http://localhost:3000` as redirect URI
2. Test with a test Google account
3. Verify advertiser/employee restrictions work

### Production Testing:
1. Update redirect URIs in Google Cloud Console
2. Test with real advertiser/employee emails
3. Verify redirects work correctly

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Check that redirect URIs in Google Cloud Console match exactly
- Include both `http://localhost:3000` and production URLs

### "access_denied" Error
- User may have denied permissions
- Check OAuth consent screen configuration

### User Not Found After OAuth
- Verify email matching logic
- Check that advertiser/employee exists in database
- Verify status checks (APPROVED for advertisers, isAdmin for employees)

---

## Next Steps

After implementation:
1. Test with real advertiser accounts
2. Test with employee/admin accounts
3. Monitor error logs for OAuth issues
4. Consider adding 2FA for additional security
5. Add logging for OAuth login attempts

