import { prisma } from '../lib/db/prisma'

async function checkDebateBySlug(slug: string) {
  try {
    console.log(`\n🔍 Checking debate with slug: ${slug}\n`)

    // Try to find by slug
    const debate = await prisma.debate.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        topic: true,
        status: true,
        visibility: true,
        challenger: {
          select: {
            id: true,
            username: true,
          },
        },
        opponent: {
          select: {
            id: true,
            username: true,
          },
        },
        createdAt: true,
      },
    })

    if (debate) {
      console.log('✅ Debate found!')
      console.log(`   ID: ${debate.id}`)
      console.log(`   Topic: ${debate.topic}`)
      console.log(`   Slug: ${debate.slug}`)
      console.log(`   Status: ${debate.status}`)
      console.log(`   Visibility: ${debate.visibility}`)
      console.log(`   Challenger: ${debate.challenger.username}`)
      console.log(`   Opponent: ${debate.opponent?.username || 'None'}`)
      console.log(`   Created: ${debate.createdAt}`)
      
      if (debate.visibility !== 'PUBLIC') {
        console.log(`\n⚠️  Debate is not PUBLIC - this is why you're getting 404!`)
        console.log(`   Visibility: ${debate.visibility}`)
        console.log(`   Only PUBLIC debates are accessible via /debates/[slug] route`)
      }
      
      return debate
    }

    console.log('❌ Debate not found with that slug\n')

    // Try to find similar slugs
    console.log('🔍 Searching for similar debates...\n')
    
    const allDebates = await prisma.debate.findMany({
      where: {
        slug: {
          contains: slug.substring(0, 30), // First 30 chars
        },
      },
      select: {
        id: true,
        slug: true,
        topic: true,
        visibility: true,
      },
      take: 5,
    })

    if (allDebates.length > 0) {
      console.log(`Found ${allDebates.length} debate(s) with similar slugs:\n`)
      allDebates.forEach((d, i) => {
        console.log(`${i + 1}. Slug: ${d.slug}`)
        console.log(`   Topic: ${d.topic.substring(0, 60)}...`)
        console.log(`   Visibility: ${d.visibility}`)
        console.log('')
      })
    } else {
      console.log('No similar debates found\n')
    }

    // Check if slug might be a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
    if (isUUID) {
      console.log('💡 Note: This looks like a UUID. Try accessing via /debates/[id] route instead.')
    }

    return null
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Get slug from command line argument
const slug = process.argv[2]

if (!slug) {
  console.error('Usage: npx tsx scripts/check-debate-by-slug.ts <slug>')
  console.error('Example: npx tsx scripts/check-debate-by-slug.ts should-instant-replay-and-advanced-technology-play-a-larger-role-in-officiating-sports-whzra1')
  process.exit(1)
}

checkDebateBySlug(slug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
