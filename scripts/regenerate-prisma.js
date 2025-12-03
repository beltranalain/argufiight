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

// Verify DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!')
  console.error('   Please set DATABASE_URL in your Vercel environment variables.')
  process.exit(1)
}

// Check if it's PostgreSQL (not SQLite)
if (databaseUrl.startsWith('file:') || databaseUrl.includes('.db')) {
  console.error('❌ ERROR: DATABASE_URL appears to be SQLite, but schema requires PostgreSQL!')
  console.error('   DATABASE_URL should start with "postgres://" or "postgresql://"')
  process.exit(1)
}

if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
  console.warn('⚠️  WARNING: DATABASE_URL does not start with postgres:// or postgresql://')
  console.warn('   Current value starts with:', databaseUrl.substring(0, 20) + '...')
}

console.log('  → DATABASE_URL is set (PostgreSQL connection)')

// Clear Prisma cache directories
const cachePaths = [
  join(rootDir, 'node_modules', '.prisma'),
  join(rootDir, 'node_modules', '@prisma', 'client', '.prisma'),
]

for (const cachePath of cachePaths) {
  if (existsSync(cachePath)) {
    console.log(`  → Clearing Prisma cache: ${cachePath}`)
    try {
      rmSync(cachePath, { recursive: true, force: true })
    } catch (e) {
      console.log(`  → Could not clear cache (may not exist): ${e.message}`)
    }
  }
}

// Regenerate Prisma Client
console.log('  → Regenerating Prisma Client with PostgreSQL provider...')
try {
  execSync('npx prisma generate', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure DATABASE_URL is available
      DATABASE_URL: databaseUrl,
    },
  })
  console.log('✅ Prisma Client regenerated successfully!')
  console.log('  → Client is now configured for PostgreSQL')
} catch (error) {
  console.error('❌ Failed to regenerate Prisma Client:', error.message)
  process.exit(1)
}

