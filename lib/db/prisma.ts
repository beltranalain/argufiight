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

// Create Prisma Client with connection retry logic
const createPrismaClient = () => {
  // Use DIRECT_URL for serverless if available, otherwise use DATABASE_URL
  // DIRECT_URL is better for serverless functions as it doesn't use connection pooling
  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })

  // Add connection retry logic with exponential backoff
  const connectWithRetry = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        await client.$connect()
        return
      } catch (error: any) {
        if (i === retries - 1) {
          console.error('❌ Failed to connect to database after retries:', error.message)
          console.error('   DATABASE_URL exists:', !!process.env.DATABASE_URL)
          console.error('   DIRECT_URL exists:', !!process.env.DIRECT_URL)
          if (process.env.DATABASE_URL) {
            const url = new URL(process.env.DATABASE_URL)
            console.error('   Host:', url.hostname)
            console.error('   Port:', url.port)
          }
          // Don't throw - let individual queries handle the error
        } else {
          console.warn(`⚠️  Database connection attempt ${i + 1} failed, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          delay *= 2 // Exponential backoff
        }
      }
    }
  }

  // Try to connect (non-blocking)
  connectWithRetry().catch(() => {
    // Connection will be retried on first query
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
