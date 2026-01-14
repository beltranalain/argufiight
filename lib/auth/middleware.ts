import { NextRequest, NextResponse } from 'next/server'
import { verifySession as verifySessionEdge } from './session-verify'

export async function middleware(req: NextRequest) {
  try {
    // Set pathname in headers so layouts can access it
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-pathname', req.nextUrl.pathname)
    
    // Also set it as a custom header that Next.js will pass through
    requestHeaders.set('x-invoke-path', req.nextUrl.pathname)

    // Use lightweight Edge-safe verification (JWT only, no database)
    const session = await verifySessionEdge()

    // Protected routes - only check session, admin check is done in layout
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      // Admin check is handled in app/admin/layout.tsx (Node.js runtime)
    }

    // Profile routes are handled by (dashboard)/layout.tsx which requires authentication
    // No need to check here as the layout will handle it

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Also set the header in the response headers (some Next.js versions need this)
    response.headers.set('x-pathname', req.nextUrl.pathname)
    
    return response
  } catch (error) {
    // If session verification fails, allow the request to continue
    // The page/layout will handle authentication checks
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

