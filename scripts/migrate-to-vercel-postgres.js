#!/usr/bin/env node

/**
 * Migration Script: Prisma Data Platform → Vercel Postgres
 * 
 * This script helps migrate from Prisma Data Platform to Vercel Postgres
 * by testing the connection and running migrations.
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`\n[Step ${step}] ${message}`, 'cyan')
}

async function testConnection(databaseUrl, directUrl) {
  logStep(1, 'Testing database connection...')
  
  if (!databaseUrl || !directUrl) {
    log('❌ DATABASE_URL or DIRECT_URL not set!', 'red')
    log('   Please set these environment variables:', 'yellow')
    log('   export DATABASE_URL="your-vercel-postgres-url"', 'yellow')
    log('   export DIRECT_URL="your-vercel-postgres-direct-url"', 'yellow')
    process.exit(1)
  }

  // Validate connection strings
  if (!databaseUrl.includes('vercel-storage.com') && !databaseUrl.includes('vercel-postgres')) {
    log('⚠️  WARNING: DATABASE_URL does not look like Vercel Postgres', 'yellow')
    log(`   Current: ${databaseUrl.substring(0, 50)}...`, 'yellow')
  }

  if (!directUrl.includes('vercel-storage.com') && !directUrl.includes('vercel-postgres')) {
    log('⚠️  WARNING: DIRECT_URL does not look like Vercel Postgres', 'yellow')
    log(`   Current: ${directUrl.substring(0, 50)}...`, 'yellow')
  }

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })

    log('   Connecting to database...', 'blue')
    await prisma.$connect()
    log('   ✅ Connection successful!', 'green')

    // Test a simple query
    log('   Testing query...', 'blue')
    const userCount = await prisma.user.count()
    log(`   ✅ Query successful! Found ${userCount} users.`, 'green')

    await prisma.$disconnect()
    return true
  } catch (error) {
    log(`   ❌ Connection failed: ${error.message}`, 'red')
    if (error.message.includes('Can\'t reach database')) {
      log('   💡 Make sure:', 'yellow')
      log('      - Database is created in Vercel', 'yellow')
      log('      - Connection strings are correct', 'yellow')
      log('      - Database is not paused', 'yellow')
    }
    return false
  }
}

async function runMigrations() {
  logStep(2, 'Running Prisma migrations...')
  
  try {
    log('   Running: npx prisma migrate deploy', 'blue')
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    })
    log('   ✅ Migrations completed!', 'green')
    return true
  } catch (error) {
    log(`   ❌ Migration failed: ${error.message}`, 'red')
    return false
  }
}

function checkPrismaSchema() {
  logStep(0, 'Checking Prisma schema...')
  
  try {
    const fs = require('fs')
    const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
    
    if (!schema.includes('provider = "postgresql"')) {
      log('   ❌ Schema is not configured for PostgreSQL!', 'red')
      return false
    }
    
    if (!schema.includes('directUrl')) {
      log('   ⚠️  Schema does not have directUrl configured', 'yellow')
      log('   💡 Add: directUrl = env("DIRECT_URL") to datasource', 'yellow')
    }
    
    log('   ✅ Schema is configured for PostgreSQL', 'green')
    return true
  } catch (error) {
    log(`   ❌ Could not read schema: ${error.message}`, 'red')
    return false
  }
}

async function main() {
  log('\n🚀 Vercel Postgres Migration Helper\n', 'cyan')
  log('This script will help you migrate to Vercel Postgres', 'blue')
  log('=' .repeat(60), 'blue')

  // Check schema
  if (!checkPrismaSchema()) {
    process.exit(1)
  }

  // Get environment variables
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  // Test connection
  const connectionOk = await testConnection(databaseUrl, directUrl)
  if (!connectionOk) {
    log('\n❌ Connection test failed. Please fix the connection strings and try again.', 'red')
    process.exit(1)
  }

  // Ask for confirmation
  log('\n📋 Ready to run migrations:', 'cyan')
  log('   - This will create all tables in your Vercel Postgres database', 'blue')
  log('   - Existing data in the new database will be preserved', 'blue')
  log('   - Make sure you have the correct DATABASE_URL and DIRECT_URL set', 'yellow')
  
  // In a real scenario, you might want to add a prompt here
  // For now, we'll just proceed
  log('\n   Proceeding with migrations...', 'blue')

  // Run migrations
  const migrationsOk = await runMigrations()
  if (!migrationsOk) {
    log('\n❌ Migration failed. Check the error messages above.', 'red')
    process.exit(1)
  }

  // Final test
  logStep(3, 'Final connection test...')
  const finalTest = await testConnection(databaseUrl, directUrl)
  
  if (finalTest) {
    log('\n✅ Migration completed successfully!', 'green')
    log('\n📝 Next steps:', 'cyan')
    log('   1. Update Vercel environment variables with new connection strings', 'blue')
    log('   2. Redeploy your application', 'blue')
    log('   3. Test your application at: https://your-app.vercel.app', 'blue')
    log('   4. Test database connection: https://your-app.vercel.app/api/test-db', 'blue')
  } else {
    log('\n⚠️  Migration completed but final test failed', 'yellow')
    log('   Check your connection strings and try again', 'yellow')
  }
}

// Run the script
main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red')
  console.error(error)
  process.exit(1)
})

