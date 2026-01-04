'use client'

import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface ViewBeltModalProps {
  isOpen: boolean
  onClose: () => void
  belt: {
    id: string
    name: string
    type: string
    category: string | null
    status: string
    coinValue: number
    designImageUrl: string | null
    sponsorName: string | null
    sponsorLogoUrl: string | null
    currentHolder: {
      id: string
      username: string
      avatarUrl: string | null
      eloRating: number
    } | null
    timesDefended: number
    successfulDefenses: number
    acquiredAt: string | null
    lastDefendedAt: string | null
    createdAt: string
  }
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500 text-white'
    case 'INACTIVE':
      return 'bg-yellow-500 text-white'
    case 'VACANT':
      return 'bg-gray-500 text-white'
    case 'STAKED':
      return 'bg-blue-500 text-white'
    case 'MANDATORY':
      return 'bg-red-500 text-white'
    case 'GRACE_PERIOD':
    case 'GRACEPERIOD':
      return 'bg-purple-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'ROOKIE':
      return 'bg-blue-500 text-white'
    case 'CATEGORY':
      return 'bg-green-500 text-white'
    case 'CHAMPIONSHIP':
      return 'bg-yellow-500 text-white'
    case 'UNDEFEATED':
      return 'bg-purple-500 text-white'
    case 'TOURNAMENT':
      return 'bg-orange-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const formatBeltStatus = (status: string) => {
  return status.replace(/_/g, ' ')
}

export function ViewBeltModal({ isOpen, onClose, belt }: ViewBeltModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="View Belt Details">
      <div className="space-y-6">
        {/* Belt Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-bg-tertiary">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary mb-2">{belt.name}</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getTypeBadgeColor(belt.type)} style={{ color: '#ffffff' }}>
                {belt.type}
              </Badge>
              <Badge className={getStatusBadgeColor(belt.status)} style={{ color: '#ffffff' }}>
                {formatBeltStatus(belt.status)}
              </Badge>
              {belt.category && (
                <span className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600 text-white">
                  {belt.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Belt Image - Prominent Display */}
        {belt.designImageUrl ? (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Belt Design
            </label>
            <div className="relative w-full min-h-[400px] bg-bg-secondary border-2 border-bg-tertiary rounded-xl overflow-hidden flex items-center justify-center p-8">
              <img
                src={belt.designImageUrl}
                alt={belt.name}
                className="max-w-full max-h-[500px] w-auto h-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-text-secondary text-lg">Image not available</div>'
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Belt Design
            </label>
            <div className="relative w-full min-h-[400px] bg-bg-secondary border-2 border-bg-tertiary border-dashed rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center text-text-secondary">
                <p className="text-lg mb-2">No belt image set</p>
                <p className="text-sm">Add a design image URL to see the visual belt</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Holder */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Current Holder
          </label>
          <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
            {belt.currentHolder ? (
              <div>
                <p className="text-text-primary font-medium">{belt.currentHolder.username}</p>
                <p className="text-text-secondary text-sm mt-1">ELO: {belt.currentHolder.eloRating}</p>
              </div>
            ) : (
              <p className="text-text-secondary">Vacant</p>
            )}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Coin Value
            </label>
            <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <p className="text-text-primary font-medium">{belt.coinValue}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Defenses
            </label>
            <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <p className="text-text-primary font-medium">
                {belt.successfulDefenses} / {belt.timesDefended}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Acquired
            </label>
            <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <p className="text-text-primary font-medium text-sm">
                {belt.acquiredAt
                  ? new Date(belt.acquiredAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Last Defended
            </label>
            <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <p className="text-text-primary font-medium text-sm">
                {belt.lastDefendedAt
                  ? new Date(belt.lastDefendedAt).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Sponsor Information */}
        {(belt.sponsorName || belt.sponsorLogoUrl) && (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Sponsor Information
            </label>
            <div className="space-y-3">
              {belt.sponsorName && (
                <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
                  <p className="text-text-secondary text-sm mb-1">Sponsor Name</p>
                  <p className="text-text-primary font-medium">{belt.sponsorName}</p>
                </div>
              )}
              {belt.sponsorLogoUrl && (
                <div>
                  <p className="text-text-secondary text-sm mb-2">Sponsor Logo</p>
                  <div className="relative w-32 h-16 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden">
                    <img
                      src={belt.sponsorLogoUrl}
                      alt={belt.sponsorName || 'Sponsor logo'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const parent = e.currentTarget.parentElement
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-text-secondary text-xs">Logo not available</div>'
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Design Image URL */}
        {belt.designImageUrl && (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Design Image URL
            </label>
            <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <p className="text-text-primary text-sm break-all">{belt.designImageUrl}</p>
            </div>
          </div>
        )}

        {/* Created Date */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Created
          </label>
          <div className="p-3 bg-bg-secondary border border-bg-tertiary rounded-lg">
            <p className="text-text-primary text-sm">
              {new Date(belt.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
