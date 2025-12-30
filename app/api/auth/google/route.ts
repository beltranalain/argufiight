import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Use environment variable only (no database query to reduce compute time)
  const clientId = process.env.GOOGLE_CLIENT_ID
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID environment variable in Vercel.' },
      { status: 500 }
    )
  }

  // Get the intended redirect URL and user type from query params
  const searchParams = request.nextUrl.searchParams
  const returnTo = searchParams.get('returnTo') || '/'
  const userType = searchParams.get('userType') || 'user' // 'user', 'advertiser', or 'employee'
  const addAccount = searchParams.get('addAccount') === 'true'
  // Detect mobile by checking for custom scheme (honorableai://) or mobile://
  const isMobile = returnTo.startsWith('mobile://') || returnTo.startsWith('honorableai://')

  // Use mobile callback if it's a mobile request
  const finalRedirectUri = isMobile 
    ? `${baseUrl}/api/auth/google/mobile-callback`
    : redirectUri

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({ returnTo, userType, addAccount, isMobile }), // Store return URL, user type, addAccount flag, and mobile flag for CSRF protection
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(authUrl)
}

