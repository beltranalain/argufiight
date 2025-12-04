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
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

