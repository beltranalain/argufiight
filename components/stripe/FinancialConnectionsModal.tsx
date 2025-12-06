'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { loadStripe } from '@stripe/stripe-js'

interface FinancialConnectionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  apiEndpoint: string
  permissions?: string[]
}

export function FinancialConnectionsModal({
  isOpen,
  onClose,
  onSuccess,
  apiEndpoint,
  permissions = ['payment_method', 'balances'],
}: FinancialConnectionsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripe, setStripe] = useState<any>(null)

  useEffect(() => {
    // Load Stripe.js
    const initStripe = async () => {
      try {
        // Fetch publishable key from API (supports both env vars and database settings)
        const keyResponse = await fetch('/api/stripe/publishable-key')
        if (!keyResponse.ok) {
          const errorData = await keyResponse.json()
          throw new Error(errorData.error || 'Stripe publishable key not found')
        }
        const { publishableKey } = await keyResponse.json()
        if (!publishableKey) {
          throw new Error('Stripe publishable key not found')
        }
        const stripeInstance = await loadStripe(publishableKey)
        setStripe(stripeInstance)
      } catch (err: any) {
        console.error('Failed to load Stripe:', err)
        setError('Failed to initialize payment system')
      }
    }

    if (isOpen) {
      initStripe()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !stripe) return

    const handleFinancialConnections = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Create Financial Connections session
        const params = new URLSearchParams()
        permissions.forEach(perm => params.append('permissions', perm))
        
        const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
          method: 'POST',
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create Financial Connections session')
        }

        const { client_secret } = await response.json()

        if (!client_secret) {
          throw new Error('No client secret returned')
        }

        // Launch Financial Connections modal
        const { error: stripeError } = await stripe.collectFinancialConnectionsAccounts({
          clientSecret: client_secret,
        })

        if (stripeError) {
          // If user closes the modal, it's not necessarily an error
          if (stripeError.type === 'validation_error' || stripeError.code === 'resource_missing') {
            throw new Error(stripeError.message || 'Failed to connect account')
          }
          // User might have cancelled - just close
          if (stripeError.type === 'card_error' && stripeError.code === 'card_declined') {
            onClose()
            return
          }
          throw new Error(stripeError.message || 'Failed to connect account')
        }

        // Success - close modal and notify parent
        onSuccess()
        onClose()
      } catch (err: any) {
        console.error('Financial Connections error:', err)
        setError(err.message || 'Failed to connect financial account')
      } finally {
        setIsLoading(false)
      }
    }

    // Small delay to ensure modal is rendered
    const timer = setTimeout(() => {
      handleFinancialConnections()
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, stripe, apiEndpoint, permissions, onSuccess, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Bank Account"
      size="large"
    >
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        {isLoading && (
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-text-secondary">
              Connecting your bank account...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-neon-orange mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary hover:bg-bg-tertiary"
            >
              Close
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="text-center">
            <p className="text-text-secondary">
              The Stripe Financial Connections modal should appear above.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}

