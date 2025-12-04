#!/usr/bin/env node
/**
 * Master seed script - Seeds all initial data for the application
 * Run: npx tsx scripts/seed-all.ts
 */

import { prisma } from '../lib/db/prisma'
import { JUDGE_PERSONALITIES } from '../lib/ai/judges'

async function seedAll() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // 1. Seed Categories
    console.log('📁 Seeding Categories...')
    const INITIAL_CATEGORIES = [
      { name: 'SPORTS', label: 'Sports', icon: '🏈', color: '#10B981', sortOrder: 1 },
      { name: 'POLITICS', label: 'Politics', icon: '🏛️', color: '#3B82F6', sortOrder: 2 },
      { name: 'TECH', label: 'Tech', icon: '💻', color: '#8B5CF6', sortOrder: 3 },
      { name: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', color: '#F59E0B', sortOrder: 4 },
      { name: 'SCIENCE', label: 'Science', icon: '🔬', color: '#06B6D4', sortOrder: 5 },
      { name: 'OTHER', label: 'Other', icon: '💭', color: '#6B7280', sortOrder: 6 },
    ]

    for (const category of INITIAL_CATEGORIES) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {
          label: category.label,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
        },
        create: {
          name: category.name,
          label: category.label,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      })
      console.log(`  ✓ ${category.label}`)
    }

    // 2. Seed AI Judges
    console.log('\n⚖️  Seeding AI Judges...')
    await prisma.judge.deleteMany() // Clear existing judges first
    
    for (const judge of JUDGE_PERSONALITIES) {
      await prisma.judge.create({
        data: {
          name: judge.name,
          personality: judge.personality,
          emoji: judge.emoji,
          description: judge.description,
          systemPrompt: judge.systemPrompt,
        },
      })
      console.log(`  ✓ ${judge.name} ${judge.emoji}`)
    }

    // 3. Seed Homepage Sections
    console.log('\n📄 Seeding Homepage Sections...')
    const sections = [
      {
        key: 'hero',
        title: 'Welcome to Honorable AI',
        content: '<p>The world\'s first AI-judged debate platform. Engage in structured debates and get judged by AI personalities.</p>',
        order: 0,
        isVisible: true,
        variant: 'hero',
        metaTitle: 'Honorable AI - AI-Judged Debate Platform',
        metaDescription: 'Engage in structured debates judged by AI personalities. Climb the ELO leaderboard and prove your argumentation skills.',
      },
      {
        key: 'features',
        title: 'Features',
        content: '<p>Discover what makes Honorable AI unique:</p><ul><li>AI-powered judges with distinct personalities</li><li>ELO ranking system</li><li>Structured debate format</li><li>Real-time chat and engagement</li></ul>',
        order: 1,
        isVisible: true,
        variant: 'features',
      },
      {
        key: 'how-it-works',
        title: 'How It Works',
        content: '<p>1. Create or accept a debate challenge<br/>2. Submit your arguments over 5 rounds<br/>3. Get judged by AI personalities<br/>4. Climb the ELO leaderboard</p>',
        order: 2,
        isVisible: true,
        variant: 'how-it-works',
      },
      {
        key: 'testimonials',
        title: 'What Users Say',
        content: '<p>Join thousands of debaters who are improving their argumentation skills every day.</p>',
        order: 3,
        isVisible: true,
        variant: 'testimonials',
      },
      {
        key: 'app-download',
        title: 'Download Our App',
        content: '<p>Get the Honorable AI app on your mobile device and debate on the go!</p>',
        order: 4,
        isVisible: true,
        variant: 'app-download',
      },
    ]

    for (const section of sections) {
      await prisma.homepageSection.upsert({
        where: { key: section.key },
        update: {
          title: section.title,
          content: section.content,
          order: section.order,
          isVisible: section.isVisible,
          variant: section.variant,
          metaTitle: section.metaTitle || null,
          metaDescription: section.metaDescription || null,
        },
        create: {
          key: section.key,
          title: section.title,
          content: section.content,
          order: section.order,
          isVisible: section.isVisible,
          variant: section.variant,
          metaTitle: section.metaTitle || null,
          metaDescription: section.metaDescription || null,
        },
      })
      console.log(`  ✓ ${section.title}`)
    }

    // 4. Seed Legal Pages
    console.log('\n📜 Seeding Legal Pages...')
    const legalPages = [
      {
        slug: 'terms',
        title: 'Terms of Service',
        content: '<h1>Terms of Service</h1><p>Welcome to Honorable AI. By using our platform, you agree to these terms.</p><h2>1. Acceptance of Terms</h2><p>By accessing and using Honorable AI, you accept and agree to be bound by the terms and provision of this agreement.</p><h2>2. Use License</h2><p>Permission is granted to temporarily use Honorable AI for personal, non-commercial use only.</p><h2>3. User Conduct</h2><p>Users must conduct themselves respectfully and follow community guidelines.</p><h2>4. Intellectual Property</h2><p>All content on Honorable AI is the property of Honorable AI and protected by copyright laws.</p>',
        isVisible: true,
        metaTitle: 'Terms of Service - Honorable AI',
        metaDescription: 'Read the Terms of Service for Honorable AI debate platform.',
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p><h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, participate in debates, or contact us.</p><h2>2. How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services.</p><h2>3. Information Sharing</h2><p>We do not sell, trade, or rent your personal information to third parties.</p><h2>4. Data Security</h2><p>We implement appropriate security measures to protect your personal information.</p>',
        isVisible: true,
        metaTitle: 'Privacy Policy - Honorable AI',
        metaDescription: 'Read the Privacy Policy for Honorable AI debate platform.',
      },
    ]

    for (const page of legalPages) {
      await prisma.legalPage.upsert({
        where: { slug: page.slug },
        update: {
          title: page.title,
          content: page.content,
          isVisible: page.isVisible,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
        },
        create: {
          slug: page.slug,
          title: page.title,
          content: page.content,
          isVisible: page.isVisible,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
        },
      })
      console.log(`  ✓ ${page.title}`)
    }

    console.log('\n✅ All seeding completed successfully!')
  } catch (error) {
    console.error('\n❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedAll()

