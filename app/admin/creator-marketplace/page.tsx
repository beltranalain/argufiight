'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/Loading'

/**
 * Redirect page - Creator Marketplace has been consolidated into /admin/advertisements
 */
export default function CreatorMarketplacePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/advertisements?tab=marketplace')
  }, [router])

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
