'use client'

import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  feature?: string
  title?: string
  description?: string
}

export function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  title,
  description,
}: UpgradePromptProps) {
  const router = useRouter()

  const defaultTitle = 'Upgrade to Pro Required'
  const defaultDescription = feature
    ? `This feature requires a Pro subscription. Upgrade now to unlock ${feature} and all other Pro features.`
    : 'This feature requires a Pro subscription. Upgrade now to unlock all Pro features.'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || defaultTitle} size="md">
      <div className="space-y-4">
        <p className="text-text-primary">{description || defaultDescription}</p>

        <Card>
          <CardBody>
            <div className="space-y-3">
              <h3 className="font-semibold text-white">Pro Features Include:</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>Unlimited Speed Mode debates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>12 appeals per month (vs 4 for Free)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>4 tournament credits per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>"That's The One" unlimited</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green">✅</span>
                  <span>Custom profile themes & verified badge</span>
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              router.push('/signup/payment?tier=PRO&cycle=MONTHLY')
            }}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </Modal>
  )
}

