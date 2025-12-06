#!/usr/bin/env node
/**
 * Check what data exists in the database
 */

import { prisma } from '../lib/db/prisma'

async function checkData() {
  console.log('🔍 Checking database data...\n')

  try {
    // Check users
    const userCount = await prisma.user.count()
    console.log(`👤 Users: ${userCount}`)
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { email: true, username: true, isAdmin: true },
        take: 5,
      })
      users.forEach(u => {
        console.log(`   - ${u.username} (${u.email}) - Admin: ${u.isAdmin}`)
      })
    }

    // Check categories
    const categoryCount = await prisma.category.count()
    console.log(`\n📁 Categories: ${categoryCount}`)
    if (categoryCount > 0) {
      const categories = await prisma.category.findMany({
        select: { name: true, label: true },
      })
      categories.forEach(c => {
        console.log(`   - ${c.label} (${c.name})`)
      })
    }

    // Check judges
    const judgeCount = await prisma.judge.count()
    console.log(`\n⚖️  Judges: ${judgeCount}`)
    if (judgeCount > 0) {
      const judges = await prisma.judge.findMany({
        select: { name: true, emoji: true },
      })
      judges.forEach(j => {
        console.log(`   - ${j.name} ${j.emoji}`)
      })
    }

    // Check homepage sections
    const sectionCount = await prisma.homepageSection.count()
    console.log(`\n📄 Homepage Sections: ${sectionCount}`)
    if (sectionCount > 0) {
      const sections = await prisma.homepageSection.findMany({
        select: { key: true, title: true },
      })
      sections.forEach(s => {
        console.log(`   - ${s.title} (${s.key})`)
      })
    }

    // Check legal pages
    const legalCount = await prisma.legalPage.count()
    console.log(`\n📜 Legal Pages: ${legalCount}`)
    if (legalCount > 0) {
      const legal = await prisma.legalPage.findMany({
        select: { slug: true, title: true },
      })
      legal.forEach(l => {
        console.log(`   - ${l.title} (${l.slug})`)
      })
    }

    // Check debates
    const debateCount = await prisma.debate.count()
    console.log(`\n💬 Debates: ${debateCount}`)

    console.log('\n✅ Database check complete!')
  } catch (error: any) {
    console.error('❌ Error checking database:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkData()

