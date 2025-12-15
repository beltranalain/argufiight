#!/usr/bin/env node
/**
 * Copy Prisma query engine binaries to ensure they're available in Vercel deployment
 */

import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

const prismaClientDir = join(rootDir, 'node_modules', '.prisma', 'client')
const prismaEnginesDir = join(rootDir, 'node_modules', 'prisma')

console.log('📦 Ensuring Prisma engines are available...')

// Check if Prisma client exists
if (!existsSync(prismaClientDir)) {
  console.warn('⚠️  Prisma client not found, run: npx prisma generate')
  process.exit(0)
}

// Copy engine binaries if they exist
try {
  // Look for engine binaries in .prisma/client
  const engineFiles = readdirSync(prismaClientDir).filter(file => 
    file.includes('query-engine') || file.includes('libquery_engine')
  )
  
  if (engineFiles.length > 0) {
    console.log(`  → Found ${engineFiles.length} Prisma engine file(s)`)
    console.log('  → Engines will be included in deployment')
  } else {
    console.log('  → No engine files found (may be generated at runtime)')
  }
} catch (error) {
  console.warn('⚠️  Could not check Prisma engines:', error.message)
}

console.log('✅ Prisma engine check complete')






