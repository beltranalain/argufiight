#!/usr/bin/env node
/**
 * Fix client reference manifest issue for Next.js 15 route groups
 * Creates a proper client reference manifest with the correct structure
 */

import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')
const nextDir = join(rootDir, '.next', 'server', 'app')

// Check if main client reference manifest exists
const mainManifestPath = join(nextDir, '_client-reference-manifest.js')
const mainManifestMjsPath = join(nextDir, '_client-reference-manifest.mjs')

let mainManifest = null
if (existsSync(mainManifestPath)) {
  mainManifest = readFileSync(mainManifestPath, 'utf-8')
} else if (existsSync(mainManifestMjsPath)) {
  mainManifest = readFileSync(mainManifestMjsPath, 'utf-8')
}

// Create proper client reference manifest for route group
const dashboardDir = join(nextDir, '(dashboard)')
const manifestPath = join(dashboardDir, 'page_client-reference-manifest.js')

try {
  if (!existsSync(dashboardDir)) {
    mkdirSync(dashboardDir, { recursive: true })
  }
  
  // Create a proper client reference manifest
  // Next.js expects this format: module.exports = { clientModules: {}, ... }
  const manifestContent = mainManifest 
    ? mainManifest.replace('_client-reference-manifest', 'page_client-reference-manifest')
    : `// Client reference manifest for Next.js 15 route groups
module.exports = {
  clientModules: {},
  ssrModuleMappings: {},
  edgeSSRModuleMappings: {},
  entryCSSFiles: {},
  entryJSFiles: {},
  cssFiles: {},
  jsFiles: {},
  actionManifest: {
    node: {},
    edge: {},
  },
};
`

  if (!existsSync(manifestPath)) {
    writeFileSync(manifestPath, manifestContent, 'utf-8')
    console.log('✅ Created client reference manifest for route group')
  } else {
    // Update existing manifest if it's empty
    const existing = readFileSync(manifestPath, 'utf-8')
    if (existing.includes('module.exports = {}') || existing.trim().length < 100) {
      writeFileSync(manifestPath, manifestContent, 'utf-8')
      console.log('✅ Updated client reference manifest for route group')
    }
  }
} catch (error) {
  // Non-fatal - just log and continue
  console.warn('⚠️  Could not create client reference manifest:', error.message)
}

