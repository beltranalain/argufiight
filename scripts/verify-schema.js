#!/usr/bin/env node
/**
 * Verify Prisma schema is configured for PostgreSQL (not SQLite)
 * This prevents deployment with wrong database provider
 */

import { readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const schemaPath = join(rootDir, 'prisma', 'schema.prisma')

console.log('🔍 Verifying Prisma schema...')

try {
  const schemaContent = readFileSync(schemaPath, 'utf-8')
  
  // Check for SQLite provider
  if (schemaContent.includes('provider = "sqlite"')) {
    console.error('❌ ERROR: Schema is configured for SQLite!')
    console.error('   Your schema must use PostgreSQL for production.')
    console.error('   Update prisma/schema.prisma: provider = "postgresql"')
    process.exit(1)
  }
  
  // Check for PostgreSQL provider
  if (!schemaContent.includes('provider = "postgresql"')) {
    console.error('❌ ERROR: Schema provider not found or incorrect!')
    console.error('   Schema must specify: provider = "postgresql"')
    process.exit(1)
  }
  
  console.log('✅ Schema is configured for PostgreSQL')
  
  // Check migration lock
  const migrationLockPath = join(rootDir, 'prisma', 'migrations', 'migration_lock.toml')
  try {
    const lockContent = readFileSync(migrationLockPath, 'utf-8')
    if (lockContent.includes('provider = "sqlite"')) {
      console.warn('⚠️  WARNING: migration_lock.toml still has sqlite')
      console.warn('   This should be updated to postgresql')
    } else if (lockContent.includes('provider = "postgresql"')) {
      console.log('✅ Migration lock is configured for PostgreSQL')
    }
  } catch (e) {
    console.log('  → migration_lock.toml not found (this is okay)')
  }
  
} catch (error) {
  console.error('❌ Failed to read schema file:', error.message)
  process.exit(1)
}

