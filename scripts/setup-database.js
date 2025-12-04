#!/usr/bin/env node
/**
 * Setup database - Run Prisma migrations
 * This script runs database migrations to create all tables
 */

import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

console.log('🗄️  Setting up database...')

// Check if DATABASE_URL is set
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!')
  console.error('   Please add a PostgreSQL database in Railway.')
  process.exit(1)
}

console.log('  → DATABASE_URL is set')
console.log('  → Pushing database schema...')

try {
  execSync('npx prisma db push --accept-data-loss', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  })
  console.log('✅ Database setup complete!')
} catch (error) {
  console.error('❌ Failed to setup database:', error.message)
  process.exit(1)
}

