import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'

/**
 * Test endpoint to check database connection and configuration
 * Visit: https://your-site.vercel.app/api/test-db
 */
export async function GET() {
  try {
    // Check environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    const hasAuthSecret = !!process.env.AUTH_SECRET
    const hasDirectUrl = !!process.env.DIRECT_URL
    
    // Test database connection
    let connected = false
    let userCount = 0
    let error: string | null = null
    
    try {
      await prisma.$connect()
      connected = true
      userCount = await prisma.user.count()
    } catch (dbError) {
      connected = false
      error = dbError instanceof Error ? dbError.message : String(dbError)
    } finally {
      await prisma.$disconnect().catch(() => {})
    }
    
    return NextResponse.json({
      status: connected ? 'ok' : 'error',
      database: {
        connected,
        userCount,
        error,
      },
      environment: {
        hasDatabaseUrl,
        hasAuthSecret,
        hasDirectUrl,
        nodeEnv: process.env.NODE_ENV,
        // Don't expose actual values, just whether they exist
        databaseUrlPreview: hasDatabaseUrl 
          ? `${process.env.DATABASE_URL?.substring(0, 20)}...` 
          : 'NOT SET',
      },
      recommendations: {
        ...(hasDatabaseUrl ? {} : { databaseUrl: 'Set DATABASE_URL in Vercel environment variables' }),
        ...(hasAuthSecret ? {} : { authSecret: 'Set AUTH_SECRET in Vercel environment variables' }),
        ...(!connected && hasDatabaseUrl ? { connection: 'Check DATABASE_URL format and database accessibility' } : {}),
        ...(connected && userCount === 0 ? { migrations: 'Database connected but empty - run migrations: npx prisma migrate deploy' } : {}),
      },
    }, {
      status: connected ? 200 : 500
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
