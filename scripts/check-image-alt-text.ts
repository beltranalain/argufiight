import { prisma } from '../lib/db/prisma'

async function checkImageAltText() {
  try {
    console.log('\n🔍 Checking image alt text and captions in database...\n')

    // Get all sections with images
    const sections = await prisma.homepageSection.findMany({
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    })

    console.log(`Found ${sections.length} sections\n`)

    let totalImages = 0
    let imagesWithAlt = 0
    let imagesWithCaption = 0
    let imagesWithBoth = 0
    let imagesWithNeither = 0

    sections.forEach((section, sectionIndex) => {
      if (section.images.length > 0) {
        console.log(`${sectionIndex + 1}. Section: "${section.title || section.key}" (${section.key})`)
        console.log(`   Order: ${section.order}, Visible: ${section.isVisible}`)
        console.log(`   Images: ${section.images.length}\n`)

        section.images.forEach((image, imageIndex) => {
          totalImages++
          const hasAlt = !!image.alt
          const hasCaption = !!image.caption

          if (hasAlt) imagesWithAlt++
          if (hasCaption) imagesWithCaption++
          if (hasAlt && hasCaption) imagesWithBoth++
          if (!hasAlt && !hasCaption) imagesWithNeither++

          console.log(`   Image ${imageIndex + 1}:`)
          console.log(`     ID: ${image.id}`)
          console.log(`     URL: ${image.url.substring(0, 60)}...`)
          console.log(`     Alt Text: ${image.alt || '❌ MISSING'}`)
          console.log(`     Caption: ${image.caption || '❌ MISSING'}`)
          console.log(`     Position: ${image.imagePosition || 'left'}`)
          console.log(`     Order: ${image.order}`)
          console.log('')
        })
      }
    })

    console.log('\n📊 SUMMARY:\n')
    console.log(`Total Images: ${totalImages}`)
    console.log(`Images with Alt Text: ${imagesWithAlt} (${Math.round((imagesWithAlt / totalImages) * 100)}%)`)
    console.log(`Images with Caption: ${imagesWithCaption} (${Math.round((imagesWithCaption / totalImages) * 100)}%)`)
    console.log(`Images with Both: ${imagesWithBoth} (${Math.round((imagesWithBoth / totalImages) * 100)}%)`)
    console.log(`Images with Neither: ${imagesWithNeither} (${Math.round((imagesWithNeither / totalImages) * 100)}%)`)

    // Check for the specific "compete-for-championship-belts" section
    const beltsSection = sections.find(s => 
      s.key === 'compete-for-championship-belts' ||
      s.title?.toLowerCase().includes('championship') ||
      s.title?.toLowerCase().includes('belts')
    )

    if (beltsSection) {
      console.log('\n🏆 CHAMPIONSHIP BELTS SECTION:\n')
      console.log(`Section: "${beltsSection.title}" (${beltsSection.key})`)
      console.log(`Images: ${beltsSection.images.length}\n`)
      
      beltsSection.images.forEach((image, index) => {
        console.log(`Image ${index + 1}:`)
        console.log(`  Alt: "${image.alt || 'MISSING'}"`)
        console.log(`  Caption: "${image.caption || 'MISSING'}"`)
        console.log('')
      })
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkImageAltText()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
