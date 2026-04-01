import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify that a cron request is authorized.
 * Accepts either:
 * 1. Vercel's automatic cron header (x-vercel-cron: 1) — set by Vercel for scheduled crons
 * 2. Bearer token matching CRON_SECRET — for manual admin triggers
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function verifyCronAuth(request: NextRequest): NextResponse | null {
  // Vercel automatically sets this header for legitimate cron invocations
  if (request.headers.get('x-vercel-cron') === '1') {
    return null
  }

  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
