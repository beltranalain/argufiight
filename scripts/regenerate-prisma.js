#!/usr/bin/env node
/**
 * Force regenerate Prisma Client for PostgreSQL
 * This script clears any cached Prisma client and regenerates it
 */

import { execSync } from 'child_process'
import { existsSync, rmSync, readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const path = { resolve, join }

const rootDir = resolve(__dirname, '..')
const schemaPath = join(rootDir, 'prisma', 'schema.prisma')

console.log('🔄 Force regenerating Prisma Client for PostgreSQL...')

// First, verify the schema file is correct
try {
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  
  // Check for SQLite (fail if found)
  if (schemaContent.includes('provider') && schemaContent.includes('sqlite')) {
    console.error('❌ CRITICAL ERROR: schema.prisma has provider = "sqlite"!')
    console.error('   The schema file must use provider = "postgresql"')
    console.error('   Please check prisma/schema.prisma and update it.')
    process.exit(1)
  }
  
  // Check for PostgreSQL (flexible spacing)
  const hasPostgresql = schemaContent.includes('"postgresql"') || 
                        schemaContent.includes("'postgresql'") ||
                        /provider\s*=\s*["']postgresql["']/.test(schemaContent)
  
  if (!hasPostgresql) {
    console.error('❌ CRITICAL ERROR: schema.prisma does not have provider = "postgresql"!')
    console.error('   The schema file must specify: provider = "postgresql"')
    console.error('   Found in schema:', schemaContent.substring(0, 500))
    process.exit(1)
  }
  
  console.log('✅ Schema file verified: PostgreSQL provider detected')
} catch (error) {
  console.error('❌ Failed to read schema file:', error.message)
  console.error('   Schema path:', schemaPath)
  process.exit(1)
}

// DATABASE_URL is optional during build - Prisma can generate client from schema alone
// It will be required at runtime, but not during build
const databaseUrl = process.env.DATABASE_URL

if (databaseUrl) {
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
} else {
  console.log('  → DATABASE_URL not set (will generate Prisma client from schema only)')
  console.log('  → Note: DATABASE_URL will be required at runtime for database connections')
}

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
  // On Vercel, only use rhel-openssl-3.0.x (native doesn't work)
  // For local dev, we can add native but it's optional
  const isVercel = process.env.VERCEL === '1'
  const binaryTargets = isVercel ? 'rhel-openssl-3.0.x' : 'native,rhel-openssl-3.0.x'
  
  execSync('npx prisma generate', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure DATABASE_URL is available
      DATABASE_URL: databaseUrl,
    },
  })
  
  // Verify the RHEL binary was generated
  const rhelBinaryPath = join(rootDir, 'node_modules', '.prisma', 'client', 'libquery_engine-rhel-openssl-3.0.x.so.node')
  if (existsSync(rhelBinaryPath)) {
    console.log('✅ Prisma Client regenerated successfully!')
    console.log('  → Client is now configured for PostgreSQL')
    console.log('  → RHEL binary found:', rhelBinaryPath)
  } else {
    console.warn('⚠️  WARNING: RHEL binary not found after generation')
    console.warn('  → Expected path:', rhelBinaryPath)
    console.warn('  → This might cause issues on Vercel')
  }
} catch (error) {
  console.error('❌ Failed to regenerate Prisma Client:', error.message)
  process.exit(1)
}

