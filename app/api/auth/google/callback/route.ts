import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    console.log('[Google OAuth Callback] Received:', { code: !!code, state, error })

    // Handle OAuth errors
    if (error) {
      console.error('[Google OAuth Callback] OAuth error:', error)
      return NextResponse.redirect('/login?error=oauth_denied')
    }

    if (!code) {
      console.error('[Google OAuth Callback] No code received')
      return NextResponse.redirect('/login?error=oauth_failed')
    }

    // Parse state to get return URL and user type
    let returnTo = '/'
    let userType = 'user'
    let addAccount = false
    if (state) {
      try {
        // Decode URL-encoded state first
        const decodedState = decodeURIComponent(state)
        const stateData = JSON.parse(decodedState)
        returnTo = stateData.returnTo || '/'
        userType = stateData.userType || 'user'
        addAccount = stateData.addAccount === true
        console.log('[Google OAuth Callback] Parsed state:', { returnTo, userType, addAccount })
      } catch (e) {
        console.error('[Google OAuth Callback] Failed to parse OAuth state:', e, 'State:', state)
        // Try parsing without decoding (in case it's already decoded)
        try {
          const stateData = JSON.parse(state)
          returnTo = stateData.returnTo || '/'
          userType = stateData.userType || 'user'
          addAccount = stateData.addAccount === true
        } catch (e2) {
          console.error('[Google OAuth Callback] Failed to parse state even without decoding:', e2)
          // Use defaults
        }
      }
    }

    // Check admin settings first, then environment variables
    let clientId = process.env.GOOGLE_CLIENT_ID
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      try {
        const [clientIdSetting, clientSecretSetting] = await Promise.all([
          prisma.adminSetting.findUnique({ where: { key: 'GOOGLE_CLIENT_ID' } }),
          prisma.adminSetting.findUnique({ where: { key: 'GOOGLE_CLIENT_SECRET' } }),
        ])
        
        if (clientIdSetting?.value) {
          clientId = clientIdSetting.value
        }
        if (clientSecretSetting?.value) {
          clientSecret = clientSecretSetting.value
        }
      } catch (error) {
        console.error('[Google OAuth Callback] Failed to fetch Google OAuth credentials from admin settings:', error)
      }
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
    const redirectUri = `${baseUrl}/api/auth/google/callback`
    
    console.log('[Google OAuth Callback] Configuration:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      baseUrl,
      redirectUri,
    })

    if (!clientId || !clientSecret) {
      console.error('[Google OAuth Callback] Google OAuth credentials not configured')
      return NextResponse.redirect(new URL('/login?error=oauth_not_configured', baseUrl))
    }

    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)
    let tokens
    try {
      const tokenResponse = await oauth2Client.getToken(code)
      tokens = tokenResponse.tokens
    } catch (error: any) {
      console.error('Failed to exchange code for tokens:', error)
      return NextResponse.redirect('/login?error=token_exchange_failed')
    }
    
    if (!tokens.id_token) {
      return NextResponse.redirect('/login?error=no_id_token')
    }

    // Verify and decode the ID token
    let payload
    try {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      })
      payload = ticket.getPayload()
    } catch (error: any) {
      console.error('Failed to verify ID token:', error)
      return NextResponse.redirect('/login?error=token_verification_failed')
    }

    if (!payload) {
      return NextResponse.redirect('/login?error=invalid_token')
    }

    const googleId = payload.sub
    const googleEmail = payload.email?.toLowerCase()
    const googlePicture = payload.picture
    const googleName = payload.name

    if (!googleEmail) {
      return NextResponse.redirect('/login?error=no_email')
    }

    // Verify user type restrictions (only for advertisers/employees)
    // Regular users can now use Google login without restrictions
    if (userType === 'advertiser') {
      // Check if user is an approved advertiser
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: googleEmail },
      })
      if (!advertiser) {
        return NextResponse.redirect('/login?error=not_advertiser')
      }
      if (advertiser.status !== 'APPROVED') {
        return NextResponse.redirect('/login?error=advertiser_not_approved')
      }
    } else if (userType === 'employee') {
      // Check if user is an employee/admin by email
      const existingUser = await prisma.user.findUnique({
        where: { email: googleEmail },
      })
      if (!existingUser || !existingUser.isAdmin) {
        return NextResponse.redirect('/login?error=not_employee')
      }
    }
    // For regular users (userType === 'user' or no userType), no restrictions

    // Check if user exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
    })

    // If no user with Google ID, check by email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: googleEmail },
      })
    }

    // If user doesn't exist, create new user (for all user types now)
    if (!user) {
      try {
        // Generate a unique username from email
        const baseUsername = googleEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') // Remove special chars
        let username = baseUsername || 'user'
        let counter = 1
        const maxAttempts = 100 // Prevent infinite loop
        while (counter < maxAttempts && await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`
          counter++
        }
        
        if (counter >= maxAttempts) {
          // Fallback to timestamp-based username
          username = `user${Date.now()}`
        }

        // Generate a placeholder password hash for OAuth users (they won't use it)
        const crypto = require('crypto')
        const placeholderHash = crypto.randomBytes(32).toString('hex')

        console.log('[Google OAuth Callback] Creating new user:', { email: googleEmail, username })
        
        user = await prisma.user.create({
          data: {
            email: googleEmail,
            username,
            avatarUrl: googlePicture || null,
            googleId,
            googleEmail,
            googlePicture: googlePicture || null,
            googleAuthEnabled: true,
            passwordHash: placeholderHash, // Placeholder hash for OAuth users
            // Create FREE subscription for new user
            subscription: {
              create: {
                tier: 'FREE',
                status: 'ACTIVE',
              },
            },
            // Create appeal limit
            appealLimit: {
              create: {
                monthlyLimit: 4,
                currentCount: 0,
              },
            },
          },
        })
        
        console.log('[Google OAuth Callback] User created successfully:', user.id)
      } catch (createError: any) {
        console.error('[Google OAuth Callback] Failed to create user:', createError)
        console.error('[Google OAuth Callback] Create error details:', {
          message: createError?.message,
          code: createError?.code,
          meta: createError?.meta,
        })
        throw new Error(`Failed to create user account: ${createError?.message || 'Unknown error'}`)
      }
    } else {
      // Update existing user with Google OAuth info
      try {
        console.log('[Google OAuth Callback] Updating existing user:', user.id)
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            googleEmail,
            googlePicture: googlePicture || null,
            googleAuthEnabled: true,
            // Update avatar if not set
            ...(googlePicture && !user.avatarUrl ? { avatarUrl: googlePicture } : {}),
          },
        })
        console.log('[Google OAuth Callback] User updated successfully')
      } catch (updateError: any) {
        console.error('[Google OAuth Callback] Failed to update user:', updateError)
        console.error('[Google OAuth Callback] Update error details:', {
          message: updateError?.message,
          code: updateError?.code,
          meta: updateError?.meta,
        })
        throw new Error(`Failed to update user account: ${updateError?.message || 'Unknown error'}`)
      }
    }

    // Check if user wants to add account (not replace current session)
    // This is detected by checking if there's already a session cookie OR if addAccount is in state
    const cookieStore = await cookies()
    const existingSession = cookieStore.get('session')
    const isAddingAccount = !!existingSession || addAccount
    console.log('[Google OAuth Callback] Account addition check:', { 
      hasExistingSession: !!existingSession, 
      addAccountFromState: addAccount, 
      isAddingAccount 
    })

    // Create session for the new account
    try {
      console.log('[Google OAuth Callback] Creating session for user:', user.id)
      await createSession(user.id)
      console.log(`[Google OAuth Callback] Google OAuth login successful for user: ${user.email}${isAddingAccount ? ' (adding account)' : ''}`)
    } catch (sessionError: any) {
      console.error('[Google OAuth Callback] Failed to create session:', sessionError)
      console.error('[Google OAuth Callback] Session error details:', {
        message: sessionError?.message,
        code: sessionError?.code,
        stack: sessionError?.stack,
      })
      throw new Error(`Failed to create session: ${sessionError?.message || 'Unknown error'}`)
    }

    // If adding account, we need to switch back to the original account
    // The new account is now in localStorage via the session creation
    // We'll redirect to a special endpoint that handles the account addition
    if (isAddingAccount && existingSession) {
      // Parse the existing session to get the original user
      try {
        const { jwtVerify } = await import('jose')
        const secretKey = process.env.AUTH_SECRET || 'your-secret-key-change-in-production'
        const encodedKey = new TextEncoder().encode(secretKey)
        const { payload } = await jwtVerify(existingSession.value, encodedKey)
        const originalSessionToken = (payload as any).sessionToken
        
        // Get the original session
        const originalSession = await prisma.session.findUnique({
          where: { token: originalSessionToken },
          include: { user: { select: { id: true } } },
        })
        
        if (originalSession) {
          // Restore the original session
          const { SignJWT } = await import('jose')
          const sessionJWT = await new SignJWT({ sessionToken: originalSession.token })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime(originalSession.expiresAt)
            .sign(encodedKey)
          
          cookieStore.set('session', sessionJWT, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: originalSession.expiresAt,
            path: '/',
          })
          
          // Redirect back to dashboard - the new account is now in localStorage
          return NextResponse.redirect(new URL('/?accountAdded=true', baseUrl))
        }
      } catch (error) {
        console.error('Failed to restore original session:', error)
        // Fall through to normal redirect
      }
    }

    // Redirect based on user type
    try {
      if (user.isAdmin) {
        return NextResponse.redirect(new URL('/admin', baseUrl))
      } else if (userType === 'advertiser') {
        return NextResponse.redirect(new URL('/advertiser/dashboard', baseUrl))
      } else {
        // Regular users go to dashboard/home
        return NextResponse.redirect(new URL(returnTo || '/', baseUrl))
      }
    } catch (redirectError: any) {
      console.error('[Google OAuth Callback] Failed to redirect:', redirectError)
      // Fallback to simple redirect
      return NextResponse.redirect('/')
    }
  } catch (error: any) {
    console.error('[Google OAuth Callback] Error:', error)
    console.error('[Google OAuth Callback] Error stack:', error?.stack)
    console.error('[Google OAuth Callback] Error message:', error?.message)
    console.error('[Google OAuth Callback] Error details:', {
      name: error?.name,
      code: error?.code,
      cause: error?.cause,
    })
    return NextResponse.redirect('/login?error=oauth_error')
  }
}

