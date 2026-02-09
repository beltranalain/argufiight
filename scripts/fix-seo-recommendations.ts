// SEO Recommendations Fix Script
// Fixes all 8 SEO audit recommendations
// Run: npx tsx scripts/fix-seo-recommendations.ts

import { prisma } from '../lib/db/prisma'

const APP_URL = 'https://www.argufight.com'

async function upsertSeoSetting(key: string, value: string) {
  const dbKey = `seo_${key}`
  await prisma.adminSetting.upsert({
    where: { key: dbKey },
    update: { value },
    create: { key: dbKey, value, category: 'seo' },
  })
  console.log(`  [SET] ${dbKey} = ${value.substring(0, 80)}${value.length > 80 ? '...' : ''}`)
}

// Fix #5: Set default OG image
async function fixDefaultOgImage() {
  console.log('\n--- Fix #5: Default OG Image ---')
  const existing = await prisma.adminSetting.findUnique({
    where: { key: 'seo_defaultOgImage' },
  })
  if (existing?.value?.trim()) {
    console.log(`  [SKIP] Already set: ${existing.value}`)
    return
  }
  // Point to the dynamic OG image generator
  await upsertSeoSetting('defaultOgImage', `${APP_URL}/api/og/default`)
  console.log('  [OK] Default OG image set to dynamic generator')
}

// Fix #3: Complete organization schema
async function fixOrganizationSchema() {
  console.log('\n--- Fix #3: Organization Schema ---')

  const settings: Record<string, string> = {
    organizationName: 'ArguFight',
    organizationDescription:
      "The world's first debate platform with AI judges. Engage in structured debates, get judged by AI personalities, and climb the ELO leaderboard.",
    organizationLogo: `${APP_URL}/logo.png`,
    organizationContactInfo: 'support@argufight.com',
    canonicalUrlBase: APP_URL,
    siteTitle: 'ArguFight - AI-Judged Debate Platform',
    siteDescription:
      "The world's first debate platform with AI judges. Debate, compete, and climb the ELO leaderboard.",
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.adminSetting.findUnique({
      where: { key: `seo_${key}` },
    })
    if (existing?.value?.trim()) {
      console.log(`  [SKIP] seo_${key} already set`)
      continue
    }
    await upsertSeoSetting(key, value)
  }
  console.log('  [OK] Organization schema complete')
}

// Fix #2: Google Search Console verification (report only)
async function fixGscVerification() {
  console.log('\n--- Fix #2: Google Search Console Verification ---')
  const existing = await prisma.adminSetting.findUnique({
    where: { key: 'seo_googleSearchConsoleVerification' },
  })
  if (existing?.value?.trim()) {
    console.log(`  [SKIP] Already verified: ${existing.value.substring(0, 20)}...`)
    return
  }

  // Check env var
  const envGsc = process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION
  if (envGsc) {
    await upsertSeoSetting('googleSearchConsoleVerification', envGsc)
    console.log('  [OK] Set from GOOGLE_SEARCH_CONSOLE_VERIFICATION env var')
    return
  }

  console.log('  [ACTION REQUIRED] No GSC verification code found.')
  console.log('  Steps:')
  console.log('    1. Go to https://search.google.com/search-console')
  console.log('    2. Add property: https://www.argufight.com')
  console.log('    3. Choose "HTML tag" verification method')
  console.log('    4. Copy the content value from the meta tag')
  console.log('    5. Set it in Admin > SEO & GEO > Settings > Google Search Console Verification')
}

// Fix #1 & #7: Fix blog posts without OG or featured images
async function fixMissingBlogImages() {
  console.log('\n--- Fix #1 & #7: Blog Posts Missing Images ---')

  // Find posts with neither ogImage nor featuredImage
  const postsWithoutImages = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [{ ogImage: null }, { ogImage: '' }],
      featuredImageId: null,
    },
    select: { id: true, title: true, slug: true },
  })

  if (postsWithoutImages.length === 0) {
    console.log('  [SKIP] All published posts have images')
    return
  }

  console.log(`  Found ${postsWithoutImages.length} post(s) without images:`)
  for (const post of postsWithoutImages) {
    // Set ogImage to the default OG image
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { ogImage: `${APP_URL}/api/og/default` },
    })
    console.log(`  [FIX] "${post.title}" -> set default OG image`)
  }
  console.log(`  [OK] Fixed ${postsWithoutImages.length} post(s)`)
}

// Fix #4: Assign categories to uncategorized blog posts
async function fixMissingCategories() {
  console.log('\n--- Fix #4: Blog Posts Without Categories ---')

  // First, ensure we have a "General" blog post category
  let generalCategory = await prisma.blogPostCategory.findUnique({
    where: { slug: 'general' },
  })
  if (!generalCategory) {
    generalCategory = await prisma.blogPostCategory.create({
      data: {
        name: 'General',
        slug: 'general',
        description: 'General discussion and uncategorized posts',
      },
    })
    console.log('  [CREATE] Created "General" blog post category')
  }

  // Also create other common categories if they don't exist
  const commonCategories = [
    { name: 'Debate Tips', slug: 'debate-tips', description: 'Tips and strategies for debating' },
    { name: 'Platform Updates', slug: 'platform-updates', description: 'ArguFight product updates and announcements' },
    { name: 'AI & Technology', slug: 'ai-technology', description: 'AI judging, technology, and innovation' },
  ]
  for (const cat of commonCategories) {
    const existing = await prisma.blogPostCategory.findUnique({ where: { slug: cat.slug } })
    if (!existing) {
      await prisma.blogPostCategory.create({ data: cat })
      console.log(`  [CREATE] Created "${cat.name}" blog post category`)
    }
  }

  // Find uncategorized published posts
  const uncategorized = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      categories: { none: {} },
    },
    select: { id: true, title: true },
  })

  if (uncategorized.length === 0) {
    console.log('  [SKIP] All posts have categories')
    return
  }

  console.log(`  Found ${uncategorized.length} uncategorized post(s). Assigning "General"...`)
  for (const post of uncategorized) {
    await prisma.blogPostToCategory.create({
      data: {
        postId: post.id,
        categoryId: generalCategory.id,
      },
    })
    console.log(`  [FIX] "${post.title}" -> General`)
  }
  console.log(`  [OK] Assigned "General" to ${uncategorized.length} post(s)`)
}

// Fix #6: Find and fix duplicate blog titles
async function fixDuplicateTitles() {
  console.log('\n--- Fix #6: Duplicate Blog Titles ---')

  const allPosts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const titleMap = new Map<string, typeof allPosts>()
  for (const post of allPosts) {
    const key = post.title.toLowerCase().trim()
    if (!titleMap.has(key)) titleMap.set(key, [])
    titleMap.get(key)!.push(post)
  }

  const duplicates = [...titleMap.entries()].filter(([, posts]) => posts.length > 1)

  if (duplicates.length === 0) {
    console.log('  [SKIP] No duplicate titles found')
    return
  }

  for (const [title, posts] of duplicates) {
    console.log(`  Duplicate title: "${title}"`)
    // Keep the first (oldest) post title unchanged, rename the rest
    for (let i = 1; i < posts.length; i++) {
      const post = posts[i]
      const newTitle = `${post.title} (${i + 1})`
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { title: newTitle },
      })
      console.log(`  [FIX] Renamed slug="${post.slug}" to "${newTitle}"`)
    }
  }
  console.log(`  [OK] Fixed ${duplicates.length} duplicate title group(s)`)
}

// Fix #8: Identify thin content posts (report only - content must be written manually)
async function reportThinContent() {
  console.log('\n--- Fix #8: Thin Content Blog Posts (Report) ---')

  const allPosts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true, content: true },
  })

  const thinPosts = allPosts
    .map((p) => ({
      ...p,
      wordCount: p.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length,
    }))
    .filter((p) => p.wordCount < 300)
    .sort((a, b) => a.wordCount - b.wordCount)

  if (thinPosts.length === 0) {
    console.log('  [SKIP] All posts have sufficient content (300+ words)')
    return
  }

  console.log(`  Found ${thinPosts.length} post(s) with < 300 words:`)
  console.log('  -----------------------------------------------')
  for (const post of thinPosts) {
    console.log(`  ${post.wordCount.toString().padStart(4)} words | "${post.title}" (/${post.slug})`)
  }
  console.log('  -----------------------------------------------')
  console.log('  [ACTION REQUIRED] Expand these posts to 500+ words with valuable content.')
  console.log('  Edit them at: /admin/content?tab=blog')
}

// Summary
async function printSummary() {
  console.log('\n====================================')
  console.log('          SEO FIX SUMMARY')
  console.log('====================================')

  const settings = await prisma.adminSetting.findMany({
    where: { key: { startsWith: 'seo_' } },
    select: { key: true, value: true },
  })
  const seoMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))

  const checks = [
    { label: 'Default OG Image', key: 'seo_defaultOgImage' },
    { label: 'Organization Name', key: 'seo_organizationName' },
    { label: 'Site Title', key: 'seo_siteTitle' },
    { label: 'Site Description', key: 'seo_siteDescription' },
    { label: 'Canonical URL', key: 'seo_canonicalUrlBase' },
    { label: 'GSC Verification', key: 'seo_googleSearchConsoleVerification' },
  ]

  for (const check of checks) {
    const val = seoMap[check.key]
    const status = val?.trim() ? 'OK' : 'MISSING'
    console.log(`  [${status.padEnd(7)}] ${check.label}`)
  }

  const uncategorized = await prisma.blogPost.count({
    where: { status: 'PUBLISHED', categories: { none: {} } },
  })
  console.log(`  [${uncategorized === 0 ? 'OK     ' : 'PENDING'}] Uncategorized posts: ${uncategorized}`)

  const postsWithoutImages = await prisma.blogPost.count({
    where: {
      status: 'PUBLISHED',
      OR: [{ ogImage: null }, { ogImage: '' }],
      featuredImageId: null,
    },
  })
  console.log(`  [${postsWithoutImages === 0 ? 'OK     ' : 'PENDING'}] Posts without images: ${postsWithoutImages}`)

  console.log('\n  Next steps:')
  console.log('    1. Set GSC verification code (if not done)')
  console.log('    2. Expand thin content blog posts to 500+ words')
  console.log('    3. Run a new SEO audit: Admin > SEO & GEO > SEO Audit > Run Audit')
  console.log('====================================\n')
}

async function main() {
  console.log('====================================')
  console.log('  ArguFight SEO Recommendations Fix')
  console.log('====================================')

  await fixDefaultOgImage()
  await fixOrganizationSchema()
  await fixGscVerification()
  await fixMissingBlogImages()
  await fixMissingCategories()
  await fixDuplicateTitles()
  await reportThinContent()
  await printSummary()
}

main()
  .catch((error) => {
    console.error('Error running SEO fixes:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
