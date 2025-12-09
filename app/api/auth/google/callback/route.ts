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

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect('/login?error=oauth_denied')
    }

    if (!code) {
      return NextResponse.redirect('/login?error=oauth_failed')
    }

    // Parse state to get return URL and user type
    let returnTo = '/'
    let userType = 'advertiser'
    if (state) {
      try {
        const stateData = JSON.parse(state)
        returnTo = stateData.returnTo || '/'
        userType = stateData.userType || 'advertiser'
      } catch (e) {
        console.error('Failed to parse OAuth state:', e)
        // Use defaults
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
        
        if (clientIdSetting && clientIdSetting.value) {
          clientId = clientIdSetting.value
        }
        if (clientSecretSetting && clientSecretSetting.value) {
          clientSecret = clientSecretSetting.value
        }
      } catch (error) {
        console.error('Failed to fetch Google OAuth credentials from admin settings:', error)
      }
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
    const redirectUri = `${baseUrl}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect('/login?error=oauth_not_configured')
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
      // Generate a unique username from email
      const baseUsername = googleEmail.split('@')[0]
      let username = baseUsername
      let counter = 1
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`
        counter++
      }

      // Generate a placeholder password hash for OAuth users (they won't use it)
      const crypto = require('crypto')
      const placeholderHash = crypto.randomBytes(32).toString('hex')

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
      
      // If username needs to be set from Google name, prompt user later
      // For now, use email-based username
    } else {
      // Update existing user with Google OAuth info
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
    }

    // Check if user wants to add account (not replace current session)
    // This is detected by checking if there's already a session cookie
    const cookieStore = await cookies()
    const existingSession = cookieStore.get('session')
    const isAddingAccount = !!existingSession

    // Create session
    await createSession(user.id)
    console.log(`Google OAuth login successful for user: ${user.email}${isAddingAccount ? ' (adding account)' : ''}`)

    // Redirect based on user type
    if (isAddingAccount) {
      // Account added, go back to dashboard
      return NextResponse.redirect('/')
    } else if (user.isAdmin) {
      return NextResponse.redirect('/admin')
    } else if (userType === 'advertiser') {
      return NextResponse.redirect('/advertiser/dashboard')
    } else {
      // Regular users go to dashboard/home
      return NextResponse.redirect(returnTo || '/')
    }
  } catch (error: any) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect('/login?error=oauth_error')
  }
}

