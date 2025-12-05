import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId }
    if (unreadOnly) {
      where.read = false
    }

    // Use raw SQL to fetch notifications since Prisma may not recognize new notification types yet
    try {
      console.log('Fetching notifications for user:', userId, 'unreadOnly:', unreadOnly)
      // Build query with PostgreSQL syntax ($1, $2 placeholders)
      const query = unreadOnly
        ? `
        SELECT 
          n.id,
          n.user_id,
          n.type,
          n.title,
          n.message,
          n.debate_id,
          n.read,
          n.read_at,
          n.created_at
        FROM notifications n
        WHERE n.user_id = $1 AND n.read = 0
        ORDER BY n.created_at DESC
        LIMIT $2
      `
        : `
        SELECT 
          n.id,
          n.user_id,
          n.type,
          n.title,
          n.message,
          n.debate_id,
          n.read,
          n.read_at,
          n.created_at
        FROM notifications n
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT $2
      `
      
      const notificationsRaw = await prisma.$queryRawUnsafe<Array<{
        id: string
        user_id: string
        type: string
        title: string
        message: string
        debate_id: string | null
        read: number
        read_at: string | null
        created_at: Date
      }>>(query, userId, limit)

      // Fetch debate info for notifications that have a debate_id
      const debateIds = notificationsRaw
        .filter(n => n.debate_id)
        .map(n => n.debate_id!)
      const debates = debateIds.length > 0
        ? await prisma.debate.findMany({
            where: { id: { in: debateIds } },
            select: { id: true, topic: true },
          })
        : []
      const debateMap = new Map(debates.map(d => [d.id, d]))

      console.log('Found notifications (raw):', notificationsRaw.length)
      console.log('Rematch notifications:', notificationsRaw.filter(n => n.type.includes('REMATCH')).length)
      
      // Map to expected format
      const notifications = notificationsRaw.map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        debateId: n.debate_id,
        debate: n.debate_id ? debateMap.get(n.debate_id) || null : null,
        read: n.read === 1,
        readAt: n.read_at,
        createdAt: n.created_at,
      }))

      return NextResponse.json(notifications)
    } catch (error: any) {
      // Fallback to Prisma if raw SQL fails
      console.warn('Raw SQL notification fetch failed, falling back to Prisma:', error.message)
      const notifications = await prisma.notification.findMany({
        where,
        include: {
          debate: {
            select: {
              id: true,
              topic: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })
      return NextResponse.json(notifications)
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

