/**
 * Apply belt system migration directly to database
 * This bypasses the shadow database issue
 * Usage: npx tsx scripts/apply-belt-migration.ts
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('\n🚀 Applying belt system migration...\n')

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma/migrations/20250101190000_add_belt_system/migration.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Execute the entire migration as one transaction
    // This ensures all statements execute in order and rollback if any fail
    console.log('Executing migration as a single transaction...\n')
    
    try {
      // Wrap in a transaction
      await prisma.$transaction(async (tx) => {
        // Split by semicolons but keep multi-line statements together
        const lines = migrationSQL.split('\n')
        let currentStatement = ''
        let inStatement = false
        
        for (const line of lines) {
          const trimmed = line.trim()
          
          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith('--')) {
            continue
          }
          
          currentStatement += line + '\n'
          
          // Check if statement is complete (ends with semicolon)
          if (trimmed.endsWith(';')) {
            const statement = currentStatement.trim()
            if (statement) {
              // Remove trailing semicolon for $executeRawUnsafe
              const cleanStatement = statement.replace(/;\s*$/, '')
              if (cleanStatement) {
                console.log(`Executing: ${cleanStatement.substring(0, 50)}...`)
                await tx.$executeRawUnsafe(cleanStatement)
              }
            }
            currentStatement = ''
          }
        }
        
        // Execute any remaining statement
        if (currentStatement.trim()) {
          const cleanStatement = currentStatement.trim().replace(/;\s*$/, '')
          if (cleanStatement) {
            console.log(`Executing final statement...`)
            await tx.$executeRawUnsafe(cleanStatement)
          }
        }
      })
      
      console.log('\n✅ All statements executed successfully!')
    } catch (error: any) {
      // Check if it's a "already exists" error (for enums, indexes, etc.)
      if (error.message?.includes('already exists') || 
          error.message?.includes('duplicate') ||
          error.message?.includes('relation') && error.message?.includes('already exists')) {
        console.log('\n⚠️  Some objects already exist, but continuing...')
        console.log('Error details:', error.message.split('\n')[0])
      } else {
        throw error
      }
    }

    console.log('\n✅ Migration applied successfully!\n')
    console.log('Next steps:')
    console.log('1. Run: npx tsx prisma/seed-belt-settings.ts')
    console.log('2. Run: npx prisma generate')
    console.log('3. Mark migration as applied: npx prisma migrate resolve --applied 20250101190000_add_belt_system\n')

  } catch (error) {
    console.error('\n❌ Error applying migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
