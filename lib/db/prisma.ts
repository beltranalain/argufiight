import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Runtime validation: Ensure DATABASE_URL is PostgreSQL, not SQLite
const databaseUrl = process.env.DATABASE_URL
if (databaseUrl) {
  if (databaseUrl.startsWith('file:') || databaseUrl.includes('.db')) {
    throw new Error(
      'CRITICAL: DATABASE_URL is SQLite but schema requires PostgreSQL! ' +
      'The Prisma Client was generated with the wrong provider. ' +
      'This usually means the build cache needs to be cleared on Vercel.'
    )
  }
}

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
