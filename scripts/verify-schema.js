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
  
  // Check for SQLite provider (flexible spacing)
  if (schemaContent.includes('provider') && schemaContent.includes('sqlite')) {
    console.error('❌ ERROR: Schema is configured for SQLite!')
    console.error('   Your schema must use PostgreSQL for production.')
    console.error('   Update prisma/schema.prisma: provider = "postgresql"')
    process.exit(1)
  }
  
  // Check for PostgreSQL provider (flexible spacing)
  const hasPostgresql = schemaContent.includes('"postgresql"') || 
                        schemaContent.includes("'postgresql'") ||
                        /provider\s*=\s*["']postgresql["']/.test(schemaContent)
  
  if (!hasPostgresql) {
    console.error('❌ ERROR: Schema provider not found or incorrect!')
    console.error('   Schema must specify: provider = "postgresql"')
    console.error('   Found in schema:', schemaContent.match(/provider\s*=\s*["'][^"']*["']/)?.[0] || 'not found')
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

