'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

interface BeltSettings {
  id: string
  beltType: string
  defensePeriodDays: number
  inactivityDays: number
  mandatoryDefenseDays: number
  gracePeriodDays: number
  maxDeclines: number
  challengeCooldownDays: number
  challengeExpiryDays: number
  freeChallengesPerWeek: number
  eloRange: number
  activityRequirementDays: number
  winStreakBonusMultiplier: number
  entryFeeBase: number
  entryFeeMultiplier: number
  winnerRewardPercent: number
  loserConsolationPercent: number
  platformFeePercent: number
  tournamentBeltCostSmall: number
  tournamentBeltCostMedium: number
  tournamentBeltCostLarge: number
  inactiveCompetitorCount: number
  inactiveAcceptDays: number
  requireCoinsForChallenge?: boolean
}

const BELT_TYPE_LABELS: Record<string, string> = {
  ROOKIE: 'Rookie',
  CATEGORY: 'Category',
  CHAMPIONSHIP: 'Championship',
  UNDEFEATED: 'Undefeated',
  TOURNAMENT: 'Tournament',
}

export default function BeltSettingsPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<BeltSettings[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editedSettings, setEditedSettings] = useState<Partial<BeltSettings>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/belts/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to load belt settings',
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load belt settings',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (setting: BeltSettings) => {
    setEditingType(setting.beltType)
    setEditedSettings(setting)
  }

  const cancelEditing = () => {
    setEditingType(null)
    setEditedSettings({})
  }

  const saveSettings = async (beltType: string) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/belts/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beltType,
          ...editedSettings,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Belt settings updated successfully',
        })
        setEditingType(null)
        setEditedSettings({})
        fetchSettings()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to update settings',
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Belt Settings</h1>
        <p className="text-text-secondary mb-8">Manage settings for each belt type</p>
      </div>

      {/* Challenge Rules Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Challenge Rules Summary</h2>
          <p className="text-text-secondary text-sm mt-2">
            Overview of all belt challenge rules and limits
          </p>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-bg-tertiary p-4 rounded-lg border border-border border-primary/30">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-primary">📊</span>
                Challenges Per User Per Week
              </h3>
              <p className="text-text-secondary text-sm mb-2">
                <span className="text-white font-bold text-lg">{settings[0]?.freeChallengesPerWeek ?? 1} free challenge{settings[0]?.freeChallengesPerWeek !== 1 ? 's' : ''} per week</span> per user
              </p>
              <p className="text-text-secondary text-xs">
                Each user gets {settings[0]?.freeChallengesPerWeek ?? 1} free challenge{settings[0]?.freeChallengesPerWeek !== 1 ? 's' : ''} per week (resets every 7 days). Free challenges are only consumed when the challenge is accepted by the belt holder. Users can also pay coins for additional challenges.
              </p>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-text-secondary text-xs">
                  <span className="text-white font-medium">Note:</span> There is no limit on how many different users can challenge a belt holder per week. Only each individual user is limited to {settings[0]?.freeChallengesPerWeek ?? 1} free challenge{settings[0]?.freeChallengesPerWeek !== 1 ? 's' : ''} per week.
                </p>
              </div>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Challenge Cooldown</h3>
              <p className="text-text-secondary text-sm mb-2">
                Cooldown: <span className="text-white font-bold">{settings[0]?.challengeCooldownDays || 7} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                After creating a challenge, users must wait this period before challenging the same belt again.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Challenge Expiry</h3>
              <p className="text-text-secondary text-sm mb-2">
                Expires after: <span className="text-white font-bold">{settings[0]?.challengeExpiryDays || 3} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                Challenges automatically expire if not accepted or declined within this time period.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Max Declines</h3>
              <p className="text-text-secondary text-sm mb-2">
                Maximum: <span className="text-white font-bold">{settings[0]?.maxDeclines || 2} declines</span>
              </p>
              <p className="text-text-secondary text-xs">
                Belt holders can decline up to this many challenges before being forced to accept.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Grace Period</h3>
              <p className="text-text-secondary text-sm mb-2">
                Protection: <span className="text-white font-bold">{settings[0]?.gracePeriodDays || 30} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                New belt holders are protected from challenges during this grace period (first 30 days).
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Defense Period</h3>
              <p className="text-text-secondary text-sm mb-2">
                Required every: <span className="text-white font-bold">{settings[0]?.defensePeriodDays || 30} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                Belt holders must defend their belt at least once during this period to keep it active.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Mandatory Defense</h3>
              <p className="text-text-secondary text-sm mb-2">
                Required after: <span className="text-white font-bold">{settings[0]?.mandatoryDefenseDays || 60} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                After this period, belt holders must accept the next challenge or lose the belt.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">Inactivity Period</h3>
              <p className="text-text-secondary text-sm mb-2">
                Becomes inactive: <span className="text-white font-bold">{settings[0]?.inactivityDays || 30} days</span>
              </p>
              <p className="text-text-secondary text-xs">
                Belts become inactive if not defended within this period and can be challenged by anyone.
              </p>
            </div>

            <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-white mb-3">ELO Matching</h3>
              <p className="text-text-secondary text-sm mb-2">
                Range: <span className="text-white font-bold">±{settings[0]?.eloRange || 200} points</span>
              </p>
              <p className="text-text-secondary text-xs">
                Currently disabled - users can challenge any belt holder regardless of ELO difference.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {settings.map((setting) => (
        <Card key={setting.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {BELT_TYPE_LABELS[setting.beltType] || setting.beltType} Belt Settings
              </h2>
              {editingType !== setting.beltType && (
                <Button
                  onClick={() => startEditing(setting)}
                  variant="secondary"
                  size="sm"
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {editingType === setting.beltType ? (
              <div className="space-y-6">
                {/* Defense Periods */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Defense Periods (Days)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Defense Period
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.defensePeriodDays ?? setting.defensePeriodDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, defensePeriodDays: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Inactivity Days
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.inactivityDays ?? setting.inactivityDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, inactivityDays: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Mandatory Defense Days
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.mandatoryDefenseDays ?? setting.mandatoryDefenseDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, mandatoryDefenseDays: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Grace Period Days
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.gracePeriodDays ?? setting.gracePeriodDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, gracePeriodDays: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Challenge Rules */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Challenge Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Free Challenges Per Week
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.freeChallengesPerWeek ?? setting.freeChallengesPerWeek ?? 1}
                        onChange={(e) => setEditedSettings({ ...editedSettings, freeChallengesPerWeek: parseInt(e.target.value) || 1 })}
                        min="0"
                      />
                      <p className="text-text-secondary text-xs mt-1">
                        Number of free challenges users get per week
                      </p>
                    </div>
                    <div className="p-4 bg-bg-tertiary rounded-lg border border-border">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          id="requireCoinsForChallenge"
                          checked={editedSettings.requireCoinsForChallenge !== undefined ? editedSettings.requireCoinsForChallenge : (setting.requireCoinsForChallenge !== false)}
                          onChange={(e) => setEditedSettings({ ...editedSettings, requireCoinsForChallenge: e.target.checked })}
                          className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
                        />
                        <label htmlFor="requireCoinsForChallenge" className="text-sm font-medium text-white cursor-pointer">
                          Require Coins for Challenges
                        </label>
                      </div>
                      <p className="text-text-secondary text-xs ml-8">
                        When disabled, users can challenge without coins or free challenges
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Max Declines
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.maxDeclines ?? setting.maxDeclines}
                        onChange={(e) => setEditedSettings({ ...editedSettings, maxDeclines: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Challenge Cooldown (Days)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.challengeCooldownDays ?? setting.challengeCooldownDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, challengeCooldownDays: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Challenge Expiry (Days)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.challengeExpiryDays ?? setting.challengeExpiryDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, challengeExpiryDays: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* ELO Matching */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">ELO Matching</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        ELO Range
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.eloRange ?? setting.eloRange}
                        onChange={(e) => setEditedSettings({ ...editedSettings, eloRange: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Activity Requirement (Days)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.activityRequirementDays ?? setting.activityRequirementDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, activityRequirementDays: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Win Streak Bonus Multiplier
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editedSettings.winStreakBonusMultiplier ?? setting.winStreakBonusMultiplier}
                        onChange={(e) => setEditedSettings({ ...editedSettings, winStreakBonusMultiplier: parseFloat(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Coin Economics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Coin Economics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Entry Fee Base
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.entryFeeBase ?? setting.entryFeeBase}
                        onChange={(e) => setEditedSettings({ ...editedSettings, entryFeeBase: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Entry Fee Multiplier
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editedSettings.entryFeeMultiplier ?? setting.entryFeeMultiplier}
                        onChange={(e) => setEditedSettings({ ...editedSettings, entryFeeMultiplier: parseFloat(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Winner Reward (%)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.winnerRewardPercent ?? setting.winnerRewardPercent}
                        onChange={(e) => setEditedSettings({ ...editedSettings, winnerRewardPercent: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Loser Consolation (%)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.loserConsolationPercent ?? setting.loserConsolationPercent}
                        onChange={(e) => setEditedSettings({ ...editedSettings, loserConsolationPercent: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Platform Fee (%)
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.platformFeePercent ?? setting.platformFeePercent}
                        onChange={(e) => setEditedSettings({ ...editedSettings, platformFeePercent: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Tournament Costs */}
                {setting.beltType === 'TOURNAMENT' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Tournament Belt Costs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Small (8 players)
                        </label>
                        <Input
                          type="number"
                          value={editedSettings.tournamentBeltCostSmall ?? setting.tournamentBeltCostSmall}
                          onChange={(e) => setEditedSettings({ ...editedSettings, tournamentBeltCostSmall: parseInt(e.target.value) })}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Medium (16 players)
                        </label>
                        <Input
                          type="number"
                          value={editedSettings.tournamentBeltCostMedium ?? setting.tournamentBeltCostMedium}
                          onChange={(e) => setEditedSettings({ ...editedSettings, tournamentBeltCostMedium: parseInt(e.target.value) })}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Large (32+ players)
                        </label>
                        <Input
                          type="number"
                          value={editedSettings.tournamentBeltCostLarge ?? setting.tournamentBeltCostLarge}
                          onChange={(e) => setEditedSettings({ ...editedSettings, tournamentBeltCostLarge: parseInt(e.target.value) })}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Inactive Belt Rules */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Inactive Belt Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Inactive Competitor Count
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.inactiveCompetitorCount ?? setting.inactiveCompetitorCount}
                        onChange={(e) => setEditedSettings({ ...editedSettings, inactiveCompetitorCount: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Inactive Accept Days
                      </label>
                      <Input
                        type="number"
                        value={editedSettings.inactiveAcceptDays ?? setting.inactiveAcceptDays}
                        onChange={(e) => setEditedSettings({ ...editedSettings, inactiveAcceptDays: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    onClick={cancelEditing}
                    variant="secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => saveSettings(setting.beltType)}
                    variant="primary"
                    isLoading={isSaving}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Defense Period</p>
                    <p className="text-white font-medium">{setting.defensePeriodDays} days</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Inactivity</p>
                    <p className="text-white font-medium">{setting.inactivityDays} days</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Free Challenges/Week</p>
                    <p className="text-white font-medium">{setting.freeChallengesPerWeek ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Require Coins</p>
                    <p className={`font-medium ${setting.requireCoinsForChallenge !== false ? 'text-neon-orange' : 'text-cyber-green'}`}>
                      {setting.requireCoinsForChallenge !== false ? 'Yes' : 'No'}
                    </p>
                    {setting.requireCoinsForChallenge === false && (
                      <p className="text-text-secondary text-xs mt-1">Coins disabled</p>
                    )}
                  </div>
                  <div>
                    <p className="text-text-secondary">Max Declines</p>
                    <p className="text-white font-medium">{setting.maxDeclines}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">ELO Range</p>
                    <p className="text-white font-medium">±{setting.eloRange}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Entry Fee Base</p>
                    <p className="text-white font-medium">{setting.entryFeeBase} coins</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Winner Reward</p>
                    <p className="text-white font-medium">{setting.winnerRewardPercent}%</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Loser Consolation</p>
                    <p className="text-white font-medium">{setting.loserConsolationPercent}%</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Platform Fee</p>
                    <p className="text-white font-medium">{setting.platformFeePercent}%</p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
