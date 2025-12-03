import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Test if users table exists
    const userCount = await prisma.user.count()
    
    // Test if sessions table exists
    const sessionCount = await prisma.session.count()
    
    // Test if admin_settings table exists
    let adminSettingCount = 0
    try {
      adminSettingCount = await prisma.adminSetting.count()
    } catch (error) {
      console.log('AdminSetting table might not exist:', error)
    }
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      tables: {
        users: userCount,
        sessions: sessionCount,
        admin_settings: adminSettingCount,
      },
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      databaseUrl: process.env.DATABASE_URL ? 'set' : 'not set',
    }, { status: 500 })
  }
}

