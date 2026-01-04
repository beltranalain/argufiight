import { prisma } from '../lib/db/prisma'

async function updateAIDelay() {
  const aiUser = await prisma.user.findUnique({
    where: { username: 'RoberRed' },
    select: { id: true, username: true, aiResponseDelay: true },
  })

  if (!aiUser) {
    console.log('❌ AI user not found')
    return
  }

  console.log(`\n📊 Current AI User: ${aiUser.username}`)
  console.log(`   Current delay: ${aiUser.aiResponseDelay || 'null'}ms (${aiUser.aiResponseDelay ? Math.floor(aiUser.aiResponseDelay / 60000) : 'N/A'} minutes)\n`)

  // Update to 2.5 minutes (150000ms)
  await prisma.user.update({
    where: { id: aiUser.id },
    data: { aiResponseDelay: 150000 },
  })

  console.log('✅ Updated aiResponseDelay to 150000ms (2.5 minutes)')
  console.log('   The AI will now respond within 2-3 minutes after your statement\n')

  await prisma.$disconnect()
}

updateAIDelay()
