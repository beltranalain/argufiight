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

        // Fetch publishable key from API (supports both env vars and database settings)
        // Add cache-busting to ensure we get the latest key
        const keyResponse = await fetch(`/api/stripe/publishable-key?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        })
        if (!keyResponse.ok) {
          const errorData = await keyResponse.json()
          throw new Error(errorData.error || 'Stripe publishable key not found')
        }
        const { publishableKey } = await keyResponse.json()
        if (!publishableKey) {
          throw new Error('Stripe publishable key not found')
        }
        
        // Verify it's a test key (for development)
        if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
          throw new Error('Invalid Stripe publishable key format')
        }
        
        console.log('[StripeConnectModal] Received publishable key:', publishableKey.substring(0, 20) + '...', 'Mode:', publishableKey.startsWith('pk_test_') ? 'TEST' : 'LIVE')
        
        // Warn if using LIVE key in development
        if (publishableKey.startsWith('pk_live_') && process.env.NODE_ENV === 'development') {
          console.warn('[StripeConnectModal] WARNING: Using LIVE key in development! This should be a TEST key.')
        }

        // Fetch client secret function
        // This is called by Stripe Connect.js when it needs a client secret
        // It may be called multiple times, so we need to create a fresh session each time
        // Account sessions are single-use, so each call must create a new one
        const fetchClientSecret = async () => {
          console.log('[StripeConnectModal] Fetching client secret from:', apiEndpoint)
          
          // Add a timestamp to prevent caching
          const url = `${apiEndpoint}?t=${Date.now()}`
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for session
            cache: 'no-store', // Prevent caching
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[StripeConnectModal] Failed to fetch client secret:', {
              status: response.status,
              error: errorData.error || 'Unknown error',
              code: errorData.code,
              details: errorData.details,
            })
            
            // Provide more specific error messages
            if (errorData.code === 'CONNECT_NOT_ENABLED') {
              throw new Error('Stripe Connect is not enabled. Please enable it in your Stripe Dashboard.')
            }
            
            throw new Error(errorData.error || 'Failed to create Connect session')
          }

          const data = await response.json()
          const clientSecret = data.client_secret
          
          if (!clientSecret) {
            console.error('[StripeConnectModal] No client_secret in response:', data)
            throw new Error('No client secret returned from server')
          }

          console.log('[StripeConnectModal] Client secret received:', clientSecret.substring(0, 20) + '...')
          return clientSecret
        }

        // Initialize Connect.js
        console.log('[StripeConnectModal] Initializing Stripe Connect with publishable key:', publishableKey.substring(0, 20) + '...')
        const instance = await loadConnectAndInitialize({
          publishableKey,
          fetchClientSecret,
          onLoadError: (error) => {
            console.error('[StripeConnectModal] Connect.js load error:', error)
            if (error.type === 'invalid_request_error' && error.message?.includes('account session')) {
              setError('Failed to initialize payment connection. Please try again. If the problem persists, the account session may have expired.')
            } else {
              setError(error.message || 'Failed to initialize payment system')
            }
            setIsLoading(false)
          },
        })

        connectInstanceRef.current = instance
        setConnectInstance(instance)
        setIsLoading(false)
      } catch (err: any) {
        console.error('Failed to initialize Stripe Connect:', err)
        let errorMessage = err.message || 'Failed to initialize payment system'
        
        // Provide helpful error messages
        if (err.message?.includes('Connect is not enabled') || err.message?.includes('CONNECT_NOT_ENABLED')) {
          errorMessage = 'Stripe Connect is not enabled. For testing: 1) Make sure you are in Test Mode (toggle in top right of Stripe Dashboard), 2) Enable Stripe Connect at https://dashboard.stripe.com/settings/connect'
        } else if (err.message?.includes('Expired API Key') || err.message?.includes('expired')) {
          errorMessage = 'Your Stripe API key has expired. Please update it in Admin Settings → General → Payment Publishable Key. Get a new key from your Stripe Dashboard.'
        } else if (err.message?.includes('Invalid API Key') || err.message?.includes('invalid')) {
          errorMessage = 'Your Stripe API key is invalid. Please check it in Admin Settings → General → Payment Publishable Key.'
        }
        
        setError(errorMessage)
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
          <div className="space-y-4">
            {/* Custom messaging before Stripe form */}
            <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Complete Your Payment Setup
              </h3>
              <p className="text-sm text-text-secondary mb-2">
                This form is provided by Stripe to securely collect your payment information. 
                The process takes about 5 minutes and requires:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary ml-2">
                <li>Business information and verification</li>
                <li>Bank account details for payouts</li>
                <li>Tax information (W-9 for US businesses)</li>
              </ul>
              <p className="text-xs text-text-secondary mt-3 italic">
                All information is securely processed by Stripe and encrypted.
              </p>
            </div>

            {/* Stripe Connect Form */}
            <div className="stripe-connect-wrapper">
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
                    console.log('[StripeConnectModal] Onboarding step:', stepChange.step)
                    if (stepChange.step === 'complete') {
                      console.log('[StripeConnectModal] Onboarding completed!')
                      // Wait a moment for Stripe to process, then call success
                      setTimeout(() => {
                        onSuccess()
                        onClose()
                      }, 1000)
                    }
                  }}
                />
              </ConnectComponentsProvider>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

