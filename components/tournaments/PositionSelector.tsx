'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PositionSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (position: 'PRO' | 'CON') => void
  proCount: number
  conCount: number
  maxPerPosition: number
  isLoading?: boolean
}

export function PositionSelector({
  isOpen,
  onClose,
  onSelect,
  proCount,
  conCount,
  maxPerPosition,
  isLoading = false,
}: PositionSelectorProps) {
  const [selectedPosition, setSelectedPosition] = useState<'PRO' | 'CON' | null>(null)

  if (!isOpen) return null

  const proFull = proCount >= maxPerPosition
  const conFull = conCount >= maxPerPosition

  const handleConfirm = () => {
    if (selectedPosition) {
      onSelect(selectedPosition)
      setSelectedPosition(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-primary">Select Your Position</h2>
          <p className="text-text-secondary text-sm mt-2">
            Championship format requires choosing PRO or CON. Advancement is based on individual scores within your position group.
          </p>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Position slots info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">PRO Slots</div>
              <div className="text-2xl font-bold text-cyber-green">
                {proCount} / {maxPerPosition}
              </div>
            </div>
            <div className="text-center p-3 bg-bg-secondary rounded-lg">
              <div className="text-sm text-text-secondary mb-1">CON Slots</div>
              <div className="text-2xl font-bold text-neon-orange">
                {conCount} / {maxPerPosition}
              </div>
            </div>
          </div>

          {/* Position selection buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => !proFull && setSelectedPosition('PRO')}
              disabled={proFull || isLoading}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedPosition === 'PRO'
                  ? 'border-cyber-green bg-cyber-green/10'
                  : proFull
                  ? 'border-bg-tertiary bg-bg-secondary opacity-50 cursor-not-allowed'
                  : 'border-bg-tertiary bg-bg-secondary hover:border-cyber-green/50'
              }`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-text-primary mb-2 text-lg">PRO</h3>
                <p className="text-sm text-text-secondary mb-2">Argue in favor</p>
                {proFull && (
                  <Badge variant="default" className="bg-red-500 text-white text-xs">
                    Full
                  </Badge>
                )}
                {!proFull && selectedPosition === 'PRO' && (
                  <Badge variant="default" className="bg-cyber-green text-black text-xs">
                    Selected
                  </Badge>
                )}
              </div>
            </button>
            <button
              type="button"
              onClick={() => !conFull && setSelectedPosition('CON')}
              disabled={conFull || isLoading}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedPosition === 'CON'
                  ? 'border-neon-orange bg-neon-orange/10'
                  : conFull
                  ? 'border-bg-tertiary bg-bg-secondary opacity-50 cursor-not-allowed'
                  : 'border-bg-tertiary bg-bg-secondary hover:border-neon-orange/50'
              }`}
            >
              <div className="text-center">
                <h3 className="font-semibold text-text-primary mb-2 text-lg">CON</h3>
                <p className="text-sm text-text-secondary mb-2">Argue against</p>
                {conFull && (
                  <Badge variant="default" className="bg-red-500 text-white text-xs">
                    Full
                  </Badge>
                )}
                {!conFull && selectedPosition === 'CON' && (
                  <Badge variant="default" className="bg-neon-orange text-black text-xs">
                    Selected
                  </Badge>
                )}
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedPosition(null)
                onClose()
              }}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
              disabled={!selectedPosition || isLoading}
            >
              {isLoading ? 'Joining...' : 'Confirm & Join'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

