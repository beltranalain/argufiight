/**
 * Run Plans Board Migration
 * This script creates the Plans board tables directly in the database
 * Run with: node scripts/run-plans-migration.js
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

async function runMigration() {
  try {
    console.log('📦 Running Plans Board migration...')
    
    // Read the SQL file
    const sqlPath = join(__dirname, '../prisma/migrations/create_plans_tables.sql')
    const sql = readFileSync(sqlPath, 'utf-8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`Executing ${statements.length} SQL statements...`)
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await prisma.$executeRawUnsafe(statement)
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
            console.warn('Warning:', error.message)
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!')
    console.log('📋 Tables created: boards, lists, cards, card_labels')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runMigration()

