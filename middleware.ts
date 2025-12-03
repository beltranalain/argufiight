export { middleware } from '@/lib/auth/middleware'

// Config must be defined directly in middleware.ts (not re-exported)
export const config = {
  matcher: [
    '/admin/:path*',
    // Profile is handled by (dashboard)/layout.tsx, so we don't need middleware here
    // '/profile/:path*',
  ],
}

