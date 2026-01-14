'use client'

import { Card, CardHeader, CardBody } from '@/components/ui/Card'

interface AdPlacementGuideProps {
  campaignType?: 'PLATFORM_ADS' | 'CREATOR_SPONSORSHIP' | 'TOURNAMENT_SPONSORSHIP'
  selectedAdType?: 'BANNER' | 'IN_FEED' | 'SPONSORED_DEBATE' | null
  compact?: boolean
  onSelectPlacement?: (adType: 'BANNER' | 'IN_FEED' | 'SPONSORED_DEBATE') => void
}

export function AdPlacementGuide({ campaignType, selectedAdType, compact = false, onSelectPlacement }: AdPlacementGuideProps) {
  // Map ad types to placements
  const adTypeToPlacements: Record<string, Array<{ name: string; location: string; description: string }>> = {
    'BANNER': [
      {
        name: 'Profile Banner',
        location: 'Top of user profile pages',
        description: 'Banner ad displayed at the top of user profile pages',
      },
      {
        name: 'Debate Sidebar (Fallback)',
        location: 'Right sidebar during debates',
        description: 'May also appear in debate sidebar if no Sponsored Debate ads are available',
      },
    ],
    'IN_FEED': [
      {
        name: 'In-Feed Ads',
        location: 'Between content in lists',
        description: 'Ads appear between debates and trending topics (every 5th item)',
      },
      {
        name: 'Live Ticker',
        location: 'Bottom of all pages',
        description: 'Your ad appears in the scrolling ticker at the bottom',
      },
    ],
    'SPONSORED_DEBATE': [
      {
        name: 'Debate Sidebar',
        location: 'Right sidebar during debates',
        description: 'Sponsored ad in the debate sidebar (preferred placement)',
      },
      {
        name: 'Post-Debate',
        location: 'After debate verdict',
        description: 'Appears below the verdict for debate participants',
      },
    ],
  }

  // Determine which placements are available based on campaign type
  const getPlacements = () => {
    if (campaignType === 'PLATFORM_ADS') {
      // If adType is selected, show only that placement's details
      if (selectedAdType && adTypeToPlacements[selectedAdType]) {
        return adTypeToPlacements[selectedAdType].map(p => ({
          ...p,
          pages: [],
          icon: '',
        }))
      }
      // Otherwise show all 3 as selectable options (user must pick ONE)
      return [
        {
          name: 'Profile Banner',
          location: 'Top of user profile pages + Debate sidebar (fallback)',
          pages: [],
          description: 'Banner ad displayed at the top of user profile pages. May also appear in debate sidebar if no Sponsored Debate ads are available.',
          icon: '',
          adType: 'BANNER' as const,
        },
        {
          name: 'In-Feed Ads',
          location: 'Between content in lists + Live Ticker',
          pages: [],
          description: 'Ads appear between debates/trending topics (every 5th item) and in the scrolling ticker at the bottom of all pages.',
          icon: '',
          adType: 'IN_FEED' as const,
        },
        {
          name: 'Debate Sidebar',
          location: 'Right sidebar during debates + Post-debate',
          pages: [],
          description: 'Sponsored ad in debate sidebar (preferred placement) and after debate verdict for participants.',
          icon: '',
          adType: 'SPONSORED_DEBATE' as const,
        },
      ]
    } else if (campaignType === 'CREATOR_SPONSORSHIP') {
      return [
        {
          name: 'Creator Content',
          location: 'Within creator posts',
          pages: [],
          description: 'Ads integrated into creator content',
          icon: '',
        },
      ]
    } else if (campaignType === 'TOURNAMENT_SPONSORSHIP') {
      return [
        {
          name: 'Tournament Pages',
          location: 'Tournament listings and details',
          pages: [],
          description: 'Prominent placement on tournament pages',
          icon: '',
        },
      ]
    } else {
      // Show all placements for general view
      return [
        {
          name: 'Profile Banner',
          location: 'Top of user profile pages',
          pages: [],
          description: 'Banner ad displayed at the top of user profile pages',
          icon: '',
        },
        {
          name: 'In-Feed Ads',
          location: 'Between content in lists',
          pages: [],
          description: 'Ads appear between debates and trending topics',
          icon: '',
        },
        {
          name: 'Debate Sidebar',
          location: 'Right sidebar during debates',
          pages: [],
          description: 'Sponsored ad in the debate sidebar',
          icon: '',
        },
        {
          name: 'Live Ticker',
          location: 'Bottom of all pages',
          pages: [],
          description: 'Your ad appears in the scrolling ticker at the bottom',
          icon: '',
        },
      ]
    }
  }

  const placements = getPlacements()

  if (compact) {
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text-primary">Ad Placements</h4>
        <div className="grid grid-cols-1 gap-2">
          {placements.map((placement, index) => (
            <div
              key={index}
              className="p-3 bg-bg-secondary rounded-lg border border-bg-tertiary"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{placement.name}</p>
                  <p className="text-xs text-text-secondary">{placement.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-bold text-text-primary">
          {selectedAdType && campaignType === 'PLATFORM_ADS'
            ? 'Where Your Ad Will Appear'
            : campaignType === 'PLATFORM_ADS'
            ? 'Select 1 Placement for Your Ad'
            : 'Where Your Ads Will Appear'}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {selectedAdType && campaignType === 'PLATFORM_ADS'
            ? `Your ad will appear in the selected placement below. Each campaign appears in ONE placement location.`
            : campaignType === 'PLATFORM_ADS'
            ? 'Click on ONE placement below to select where your ad will appear. Each campaign appears in a single placement location.'
            : campaignType === 'CREATOR_SPONSORSHIP'
            ? 'Creator Sponsorship ads appear within creator content'
            : campaignType === 'TOURNAMENT_SPONSORSHIP'
            ? 'Tournament Sponsorship ads appear on tournament pages'
            : 'Your advertisements will be displayed in strategic locations across the platform'}
        </p>
      </CardHeader>
      <CardBody>
        <div className={`grid grid-cols-1 gap-4 ${
          campaignType === 'PLATFORM_ADS' && !selectedAdType 
            ? 'md:grid-cols-3' 
            : 'md:grid-cols-2'
        }`}>
          {placements.map((placement, index) => {
            const isSelectable = campaignType === 'PLATFORM_ADS' && !selectedAdType && 'adType' in placement
            const isSelected = selectedAdType && 'adType' in placement && placement.adType === selectedAdType
            
            return (
              <div
                key={index}
                onClick={() => {
                  if (isSelectable && onSelectPlacement && 'adType' in placement) {
                    onSelectPlacement(placement.adType)
                  }
                }}
                className={`p-4 bg-bg-secondary rounded-lg border transition-all ${
                  isSelectable
                    ? 'border-bg-tertiary hover:border-electric-blue hover:bg-electric-blue/5 cursor-pointer transform hover:scale-[1.02] shadow-md hover:shadow-lg'
                    : isSelected
                    ? 'border-electric-blue bg-electric-blue/10 ring-2 ring-electric-blue/20'
                    : 'border-bg-tertiary'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-text-primary">{placement.name}</h4>
                      {isSelectable && (
                        <span className="text-xs text-electric-blue">(Click to select)</span>
                      )}
                      {isSelected && (
                        <span className="text-xs text-cyber-green font-medium">✓ Selected</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{placement.description}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-bg-tertiary">
                  <p className="text-xs font-medium text-text-secondary mb-1">Location:</p>
                  <p className="text-xs text-text-primary">{placement.location}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
