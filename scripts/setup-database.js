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
// Railway sets this automatically when database is linked, but it might be in a different format
let databaseUrl = process.env.DATABASE_URL || 
                  process.env.POSTGRES_URL || 
                  process.env.PGDATABASE_URL ||
                  process.env.RAILWAY_DATABASE_URL

if (!databaseUrl) {
  console.warn('⚠️  WARNING: DATABASE_URL not found. Checking Railway environment...')
  // Railway might set it differently - check all possible env vars
  const allEnvVars = Object.keys(process.env).filter(key => 
    key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('PG')
  )
  if (allEnvVars.length > 0) {
    console.log('  → Found database-related env vars:', allEnvVars.join(', '))
    // Try to find the actual connection string
    for (const key of allEnvVars) {
      const value = process.env[key]
      if (value && (value.startsWith('postgres://') || value.startsWith('postgresql://'))) {
        databaseUrl = value
        console.log(`  → Using ${key} as DATABASE_URL`)
        break
      }
    }
  }
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!')
    console.error('   Please link the PostgreSQL database to your service in Railway.')
    console.error('   Go to your service → Settings → Variables → Check "8 variables added by Railway"')
    process.exit(1)
  }
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

