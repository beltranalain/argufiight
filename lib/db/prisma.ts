import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Runtime validation: Ensure DATABASE_URL is PostgreSQL, not SQLite
const databaseUrl = process.env.DATABASE_URL
if (databaseUrl) {
  if (databaseUrl.startsWith('file:') || databaseUrl.includes('.db')) {
    const error = new Error(
      'CRITICAL: DATABASE_URL is SQLite but schema requires PostgreSQL! ' +
      'The Prisma Client was generated with the wrong provider. ' +
      'This usually means the build cache needs to be cleared on Vercel.'
    )
    console.error('❌', error.message)
    console.error('   DATABASE_URL:', databaseUrl.substring(0, 50) + '...')
    throw error
  }
  
  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgresql+')) {
    console.warn('⚠️  WARNING: DATABASE_URL does not start with postgres:// or postgresql://')
    console.warn('   Current value starts with:', databaseUrl.substring(0, 30) + '...')
  }
} else {
  console.error('❌ CRITICAL: DATABASE_URL environment variable is not set!')
  console.error('   Please set DATABASE_URL in Vercel environment variables')
}

// Log connection info (without sensitive data)
if (databaseUrl) {
  const urlObj = new URL(databaseUrl)
  console.log('📊 Database connection:', {
    host: urlObj.hostname,
    port: urlObj.port,
    database: urlObj.pathname,
    hasDirectUrl: !!process.env.DIRECT_URL,
  })
}

// Create Prisma Client with connection retry logic and graceful shutdown
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Add connection retry logic
  client.$connect().catch((error) => {
    console.error('❌ Failed to connect to database:', error.message)
    console.error('   DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.error('   DIRECT_URL exists:', !!process.env.DIRECT_URL)
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL)
      console.error('   Host:', url.hostname)
      console.error('   Port:', url.port)
    }
  })

  // Graceful shutdown handlers to prevent connection leaks
  const cleanup = async () => {
    console.log('[Prisma] Disconnecting from database...')
    try {
      await client.$disconnect()
      console.log('✅ [Prisma] Database disconnected successfully')
    } catch (error) {
      console.error('❌ [Prisma] Error disconnecting from database:', error)
    }
  }

  // Handle process termination signals
  process.on('beforeExit', cleanup)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('SIGUSR2', cleanup) // Nodemon restart

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
