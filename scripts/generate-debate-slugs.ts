/**
 * Generate slugs for existing debates that don't have one
 * Run with: npx tsx scripts/generate-debate-slugs.ts
 */

import { PrismaClient } from '@prisma/client'
import { generateUniqueSlug } from '../lib/utils/slug'

const prisma = new PrismaClient()

async function generateSlugs() {
  console.log('🔍 Finding debates without slugs...\n')

  try {
    // Get all debates without slugs
    const debatesWithoutSlugs = await prisma.debate.findMany({
      where: {
        slug: null,
      },
      select: {
        id: true,
        topic: true,
      },
    })

    console.log(`Found ${debatesWithoutSlugs.length} debates without slugs\n`)

    if (debatesWithoutSlugs.length === 0) {
      console.log('✅ All debates already have slugs!')
      return
    }

    let successCount = 0
    let errorCount = 0

    for (const debate of debatesWithoutSlugs) {
      try {
        // Generate unique slug
        let slug = generateUniqueSlug(debate.topic)
        
        // Ensure slug is unique
        let slugExists = await prisma.debate.findUnique({ where: { slug } })
        let counter = 1
        while (slugExists) {
          slug = generateUniqueSlug(debate.topic, Math.random().toString(36).substring(2, 8))
          slugExists = await prisma.debate.findUnique({ where: { slug } })
          counter++
          if (counter > 100) {
            // Fallback
            slug = generateUniqueSlug(debate.topic, debate.id.substring(0, 8))
            break
          }
        }

        // Update debate with slug
        await prisma.debate.update({
          where: { id: debate.id },
          data: { slug },
        })

        console.log(`✅ Generated slug for: ${debate.topic.substring(0, 50)}...`)
        console.log(`   Slug: ${slug}`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Error generating slug for debate ${debate.id}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`\n✅ Slug generation complete!`)
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

generateSlugs()
