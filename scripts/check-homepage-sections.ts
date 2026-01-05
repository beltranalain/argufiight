import { prisma } from '../lib/db/prisma'

async function checkHomepageSections() {
  try {
    console.log('\n🔍 Checking homepage sections...\n')

    const sections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        key: true,
        title: true,
        order: true,
        isVisible: true,
      },
    })

    console.log(`Found ${sections.length} sections:\n`)
    
    sections.forEach((section, i) => {
      const visibility = section.isVisible ? '✅ Visible' : '❌ Hidden'
      const filtered = ['hero', 'footer', 'app-download'].includes(section.key) ? '⚠️  Filtered out' : ''
      console.log(`${i + 1}. Order ${section.order}: "${section.title || section.key}"`)
      console.log(`   Key: ${section.key}`)
      console.log(`   Status: ${visibility} ${filtered}`)
      console.log('')
    })

    // Check for "Compete for Championship Belts" section
    const beltsSection = sections.find(s => 
      s.title?.toLowerCase().includes('championship') || 
      s.title?.toLowerCase().includes('belts') ||
      s.key?.toLowerCase().includes('belt')
    )

    if (beltsSection) {
      console.log('✅ Found "Compete for Championship Belts" section:')
      console.log(`   ID: ${beltsSection.id}`)
      console.log(`   Key: ${beltsSection.key}`)
      console.log(`   Title: ${beltsSection.title}`)
      console.log(`   Order: ${beltsSection.order}`)
      console.log(`   Visible: ${beltsSection.isVisible}`)
      console.log(`   Will be filtered: ${['hero', 'footer', 'app-download'].includes(beltsSection.key)}`)
    } else {
      console.log('❌ "Compete for Championship Belts" section not found')
    }

    return sections
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkHomepageSections()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
