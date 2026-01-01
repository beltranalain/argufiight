/**
 * Check notification data to debug count issue
 * Usage: npx tsx scripts/check-notifications.ts [userId]
 */

import { prisma } from '../lib/db/prisma'

async function checkNotifications(userId?: string) {
  try {
    console.log('\n=== Checking Notifications ===\n')

    if (userId) {
      console.log(`Checking notifications for user: ${userId}\n`)
      
      // Get all notifications for this user
      const allNotifications = await prisma.$queryRawUnsafe<Array<{
        id: string
        user_id: string
        type: string
        title: string
        read: boolean | number
        created_at: Date
      }>>(`
        SELECT id, user_id, type, title, read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `, userId)

      console.log(`Total notifications: ${allNotifications.length}`)
      
      // Count by read status
      const readNotifications = allNotifications.filter(n => {
        const isRead = typeof n.read === 'boolean' ? n.read : n.read === 1 || n.read === true
        return isRead
      })
      const unreadNotifications = allNotifications.filter(n => {
        const isRead = typeof n.read === 'boolean' ? n.read : n.read === 1 || n.read === true
        return !isRead
      })

      console.log(`Read notifications: ${readNotifications.length}`)
      console.log(`Unread notifications: ${unreadNotifications.length}`)
      
      console.log('\n📋 Sample notifications:')
      allNotifications.slice(0, 10).forEach((n, i) => {
        const isRead = typeof n.read === 'boolean' ? n.read : n.read === 1 || n.read === true
        console.log(`  ${i + 1}. ${n.title} - Read: ${n.read} (${typeof n.read}) → ${isRead ? 'READ' : 'UNREAD'}`)
      })

      // Check for any notifications with unexpected read values
      const unexpected = allNotifications.filter(n => {
        const readType = typeof n.read
        return readType !== 'boolean' && n.read !== 0 && n.read !== 1
      })
      
      if (unexpected.length > 0) {
        console.log(`\n⚠️  Found ${unexpected.length} notifications with unexpected read values:`)
        unexpected.forEach(n => {
          console.log(`  - ${n.id}: read = ${n.read} (type: ${typeof n.read})`)
        })
      }
    } else {
      // Check all users
      const allNotifications = await prisma.$queryRawUnsafe<Array<{
        user_id: string
        read: boolean | number
      }>>(`
        SELECT user_id, read
        FROM notifications
        ORDER BY created_at DESC
        LIMIT 100
      `)

      console.log(`Total notifications in database: ${allNotifications.length}`)
      
      // Group by read status
      const readCount = allNotifications.filter(n => {
        const isRead = typeof n.read === 'boolean' ? n.read : n.read === 1 || n.read === true
        return isRead
      }).length
      const unreadCount = allNotifications.length - readCount

      console.log(`Read: ${readCount}`)
      console.log(`Unread: ${unreadCount}`)
      
      // Check read value types
      const booleanRead = allNotifications.filter(n => typeof n.read === 'boolean').length
      const numberRead = allNotifications.filter(n => typeof n.read === 'number').length
      
      console.log(`\nRead value types:`)
      console.log(`  Boolean: ${booleanRead}`)
      console.log(`  Number: ${numberRead}`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const userId = process.argv[2]
checkNotifications(userId)
