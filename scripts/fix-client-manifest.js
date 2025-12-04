#!/usr/bin/env node
/**
 * Fix client reference manifest issue for Next.js 15 route groups
 * Creates a dummy manifest file if it doesn't exist to prevent Vercel build errors
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const nextDir = join(rootDir, '.next', 'server', 'app', '(dashboard)')

// Create directory if it doesn't exist
try {
  if (!existsSync(nextDir)) {
    mkdirSync(nextDir, { recursive: true })
  }
  
  // Create dummy client reference manifest if it doesn't exist
  const manifestPath = join(nextDir, 'page_client-reference-manifest.js')
  if (!existsSync(manifestPath)) {
    writeFileSync(manifestPath, '// Dummy client reference manifest for Next.js 15 route groups\nmodule.exports = {};\n', 'utf-8')
    console.log('✅ Created dummy client reference manifest for route group')
  }
} catch (error) {
  // Non-fatal - just log and continue
  console.warn('⚠️  Could not create client reference manifest:', error.message)
}

