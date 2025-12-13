'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/Loading'

/**
 * Redirect page - Settings have been consolidated into /creator/dashboard
 */
export default function CreatorSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/creator/dashboard?tab=settings')
  }, [router])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
