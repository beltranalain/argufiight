#!/usr/bin/env node
/**
 * Clean build directory before building
 * Cross-platform script to remove .next directory
 */

import { rmSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const nextDir = resolve(rootDir, '.next')

try {
  console.log('🧹 Cleaning .next directory...')
  rmSync(nextDir, { recursive: true, force: true })
  console.log('✅ Cleaned .next directory')
} catch (error) {
  // Directory might not exist, that's okay
  if (error.code !== 'ENOENT') {
    console.warn('⚠️  Could not clean .next directory:', error.message)
  }
}

