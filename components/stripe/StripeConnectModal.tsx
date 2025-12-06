'use client'

import { useEffect, useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { loadConnectAndInitialize } from '@stripe/connect-js'
import { ConnectComponentsProvider, ConnectAccountOnboarding } from '@stripe/react-connect-js'

interface StripeConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  apiEndpoint: string
}

export function StripeConnectModal({
  isOpen,
  onClose,
  onSuccess,
  apiEndpoint,
}: StripeConnectModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectInstance, setConnectInstance] = useState<any>(null)
  const connectInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!isOpen) return

    const initConnect = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (!publishableKey) {
          throw new Error('Stripe publishable key not found')
        }

        // Fetch client secret function
        const fetchClientSecret = async () => {
          const response = await fetch(apiEndpoint, {
            method: 'POST',
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create Connect session')
          }

          const { client_secret } = await response.json()
          return client_secret
        }

        // Initialize Connect.js
        const instance = await loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
        })

        connectInstanceRef.current = instance
        setConnectInstance(instance)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Failed to initialize Stripe Connect:', err)
        setError(err.message || 'Failed to initialize payment system')
        setIsLoading(false)
      }
    }

    initConnect()
  }, [isOpen, apiEndpoint])

  const handleOnboardingComplete = () => {
    onSuccess()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Stripe Account"
      size="large"
    >
      <div className="min-h-[600px] flex flex-col">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-text-secondary">
                Loading Stripe Connect...
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-neon-orange mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary hover:bg-bg-tertiary"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && connectInstance && (
          <ConnectComponentsProvider connectInstance={connectInstance}>
            <ConnectAccountOnboarding
              onExit={() => {
                // When user exits, check if onboarding was completed
                // We'll refresh data to check if account is now ready
                onSuccess()
                onClose()
              }}
              onStepChange={(stepChange) => {
                // Track onboarding progress
                console.log('Onboarding step:', stepChange.step)
                if (stepChange.step === 'complete') {
                  onSuccess()
                  onClose()
                }
              }}
            />
          </ConnectComponentsProvider>
        )}
      </div>
    </Modal>
  )
}

