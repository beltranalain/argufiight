import { NextRequest, NextResponse } from 'next/server'
import { verifySession as verifySessionEdge } from './session-verify'

export async function middleware(req: NextRequest) {
  try {
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

    return NextResponse.next()
  } catch (error) {
    // If session verification fails, allow the request to continue
    // The page/layout will handle authentication checks
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

