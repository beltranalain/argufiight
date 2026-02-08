export { middleware } from '@/lib/auth/middleware'

// Config must be defined directly in middleware.ts (not re-exported)
export const config = {
  matcher: [
    '/admin/:path*',
    '/advertiser/:path*',
    '/creator/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/messages/:path*',
    '/tournaments/create',
    '/debates/saved',
    '/upgrade',
    '/belts/room',
  ],
}

