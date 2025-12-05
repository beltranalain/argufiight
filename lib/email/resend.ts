import { Resend } from 'resend'
import { prisma } from '@/lib/db/prisma'

/**
 * Get Resend API key from admin settings or environment
 */
export async function getResendKey(): Promise<string | null> {
  try {
    const setting = await prisma.adminSetting.findUnique({
      where: { key: 'RESEND_API_KEY' },
    })

    if (setting && setting.value) {
      return setting.value
    }
  } catch (error) {
    console.error('Failed to fetch Resend key from admin settings:', error)
  }

  // Fallback to env variable
  return process.env.RESEND_API_KEY || null
}

/**
 * Create Resend client
 */
export async function createResendClient(): Promise<Resend | null> {
  const apiKey = await getResendKey()
  
  if (!apiKey) {
    return null
  }
  
  return new Resend(apiKey)
}

