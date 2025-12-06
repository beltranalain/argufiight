import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    )
  }

  // Get the intended redirect URL and user type from query params
  const searchParams = request.nextUrl.searchParams
  const returnTo = searchParams.get('returnTo') || '/'
  const userType = searchParams.get('userType') || 'advertiser' // 'advertiser' or 'employee'

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({ returnTo, userType }), // Store return URL and user type for CSRF protection
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  return NextResponse.redirect(authUrl)
}

