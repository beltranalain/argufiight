#!/usr/bin/env node
/**
 * Clean build directory and Prisma cache before building
 * Cross-platform script to remove .next directory and Prisma cache
 */

import { rmSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const nextDir = resolve(rootDir, '.next')

// Prisma cache paths to clear
const prismaCachePaths = [
  join(rootDir, 'node_modules', '.prisma'),
  join(rootDir, 'node_modules', '@prisma', 'client', '.prisma'),
]

console.log('🧹 Cleaning build artifacts and caches...')

// Clean .next directory
try {
  if (existsSync(nextDir)) {
    rmSync(nextDir, { recursive: true, force: true })
    console.log('✅ Cleaned .next directory')
  } else {
    console.log('  → .next directory does not exist (okay)')
  }
} catch (error) {
  if (error.code !== 'ENOENT') {
    console.warn('⚠️  Could not clean .next directory:', error.message)
  }
}

// Clean Prisma cache
for (const cachePath of prismaCachePaths) {
  try {
    if (existsSync(cachePath)) {
      rmSync(cachePath, { recursive: true, force: true })
      console.log(`✅ Cleaned Prisma cache: ${cachePath}`)
    }
  } catch (error) {
    console.warn(`⚠️  Could not clean Prisma cache ${cachePath}:`, error.message)
  }
}

console.log('✅ Clean complete - ready for fresh build')

