/**
 * Diagnostic script to check if Tournaments feature is enabled and working
 * Run with: npx tsx scripts/check-tournaments-feature.ts
 */

import { prisma } from '../lib/db/prisma'

async function checkTournamentsFeature() {
  console.log('🔍 Checking Tournaments Feature Status...\n')

  try {
    // 1. Check if feature flag is set
    console.log('1. Checking feature flag...')
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'TOURNAMENTS_ENABLED' },
    })

    if (setting) {
      console.log(`   ✅ Feature flag exists: ${setting.key} = ${setting.value}`)
      console.log(`   Status: ${setting.value === 'true' ? '🟢 ENABLED' : '🔴 DISABLED'}`)
    } else {
      console.log('   ⚠️  Feature flag not found in database')
      console.log('   This means the feature is disabled by default')
    }

    // 2. Check if tournaments table exists
    console.log('\n2. Checking database schema...')
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tournaments'
        );
      `
      const exists = (tableCheck as any)[0]?.exists
      
      if (exists) {
        console.log('   ✅ Tournaments table exists')
        
        // Count tournaments
        const count = await prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM tournaments
        `
        const tournamentCount = Number(count[0]?.count || 0)
        console.log(`   📊 Total tournaments: ${tournamentCount}`)
      } else {
        console.log('   ⚠️  Tournaments table does not exist')
        console.log('   Run migrations to create the table')
      }
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        console.log('   ⚠️  Tournaments table does not exist')
        console.log('   Run migrations to create the table')
      } else {
        throw error
      }
    }

    // 3. Check for user-facing pages
    console.log('\n3. Checking user-facing implementation...')
    const fs = await import('fs')
    const path = await import('path')
    
    const userTournamentsPage = path.join(process.cwd(), 'app/(dashboard)/tournaments/page.tsx')
    const userTournamentsCreate = path.join(process.cwd(), 'app/(dashboard)/tournaments/create/page.tsx')
    const userTournamentsDetail = path.join(process.cwd(), 'app/(dashboard)/tournaments/[id]/page.tsx')
    const userTournamentsAPI = path.join(process.cwd(), 'app/api/tournaments/route.ts')

    const checks = [
      { path: userTournamentsPage, name: 'Tournaments list page' },
      { path: userTournamentsCreate, name: 'Create tournament page' },
      { path: userTournamentsDetail, name: 'Tournament detail page' },
      { path: userTournamentsAPI, name: 'Tournaments API endpoint' },
    ]

    let foundCount = 0
    for (const check of checks) {
      if (fs.existsSync(check.path)) {
        console.log(`   ✅ ${check.name} exists`)
        foundCount++
      } else {
        console.log(`   ❌ ${check.name} missing`)
      }
    }

    if (foundCount === 0) {
      console.log('\n   ⚠️  NO USER-FACING PAGES FOUND')
      console.log('   Users cannot access tournaments even if feature is enabled!')
    }

    // 4. Summary
    console.log('\n' + '='.repeat(50))
    console.log('📋 SUMMARY')
    console.log('='.repeat(50))
    
    const isEnabled = setting?.value === 'true'
    let hasSchema = false
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'tournaments'
        );
      `
      hasSchema = (tableCheck as any)[0]?.exists || false
    } catch {
      hasSchema = false
    }
    
    if (isEnabled && hasSchema && foundCount === 0) {
      console.log('\n⚠️  FEATURE ENABLED BUT NOT ACCESSIBLE TO USERS')
      console.log('\nThe tournaments feature is enabled in the admin panel,')
      console.log('but users cannot access it because:')
      console.log('  • No user-facing pages exist')
      console.log('  • No user API endpoints exist')
      console.log('  • No navigation links to tournaments')
      console.log('\nTo make it work, you need to:')
      console.log('  1. Create user-facing tournament pages')
      console.log('  2. Create tournament API endpoints for users')
      console.log('  3. Add navigation links')
      console.log('\nSee TOURNAMENTS_USER_GUIDE.md for details.')
    } else if (isEnabled && hasSchema && foundCount > 0) {
      console.log('\n✅ FEATURE IS ENABLED AND PARTIALLY IMPLEMENTED')
      console.log(`   Found ${foundCount}/4 user-facing components`)
    } else if (!isEnabled) {
      console.log('\n🔴 FEATURE IS DISABLED')
      console.log('   Enable it in /admin/tournaments')
    } else if (!hasSchema) {
      console.log('\n⚠️  FEATURE FLAG ENABLED BUT SCHEMA MISSING')
      console.log('   Run database migrations')
    }

  } catch (error) {
    console.error('❌ Error checking tournaments feature:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournamentsFeature()

