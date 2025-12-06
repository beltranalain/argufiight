import { NextResponse } from 'next/server'

// Public endpoint to check environment variables (no auth required)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasDeepseekKey: !!process.env.DEEPSEEK_API_KEY,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'true' : 'false',
    message: 'This endpoint is public and does not require authentication',
  })
}

