#!/usr/bin/env node
/**
 * Force regenerate Prisma Client for PostgreSQL
 * This script clears any cached Prisma client and regenerates it
 */

const { execSync } = require('child_process')
const { existsSync, rmSync } = require('fs')
const { join } = require('path')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')

console.log('🔄 Force regenerating Prisma Client for PostgreSQL...')

// Clear Prisma cache
const prismaCachePath = join(rootDir, 'node_modules', '.prisma')
if (existsSync(prismaCachePath)) {
  console.log('  → Clearing Prisma cache...')
  try {
    rmSync(prismaCachePath, { recursive: true, force: true })
  } catch (e) {
    console.log('  → Could not clear cache (may not exist):', e.message)
  }
}

// Regenerate Prisma Client
console.log('  → Regenerating Prisma Client with current DATABASE_URL...')
try {
  execSync('npx prisma generate', {
    cwd: rootDir,
    stdio: 'inherit',
  })
  console.log('✅ Prisma Client regenerated successfully!')
} catch (error) {
  console.error('❌ Failed to regenerate Prisma Client:', error.message)
  process.exit(1)
}

