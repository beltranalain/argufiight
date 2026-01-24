'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

/**
 * System Settings Tab
 * Comprehensive settings for core platform features:
 * - Verdict Settings
 * - Advertisement Settings
 * - Belt Settings
 * - Tournament Settings
 * - Notification Settings
 * - AI Bot Settings
 */
export default function SystemSettingsTab() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // System Settings State
  const [settings, setSettings] = useState({
    // Verdict Settings
    VERDICT_TIE_THRESHOLD: '5',
    VERDICT_DEADLINE_PENALTY_ENABLED: 'true',
    VERDICT_AUTO_GENERATE: 'true',

    // Advertisement Settings
    ADS_PLATFORM_FEE_BRONZE: '25',
    ADS_PLATFORM_FEE_SILVER: '20',
    ADS_PLATFORM_FEE_GOLD: '15',
    ADS_PLATFORM_FEE_PLATINUM: '10',
    ADS_ESCROW_HOLD_DAYS: '7',
    ADS_APPROVAL_REQUIRED: 'true',
    ADS_CREATOR_MARKETPLACE_ENABLED: 'true',

    // Belt Settings
    BELT_FREE_CHALLENGES_PER_WEEK: '3',
    BELT_CHALLENGE_GRACE_PERIOD_DAYS: '7',
    BELT_AUTO_EXPIRE_ENABLED: 'true',

    // Tournament Settings
    TOURNAMENT_AUTO_START_ENABLED: 'true',
    TOURNAMENT_AUTO_PROGRESSION_ENABLED: 'true',
    TOURNAMENT_MIN_PARTICIPANTS: '2',
    TOURNAMENT_DEFAULT_PRIZE_SPLIT: '60,30,10',

    // Notification Settings
    NOTIFICATION_EMAIL_ENABLED: 'true',
    NOTIFICATION_PUSH_ENABLED: 'true',
    NOTIFICATION_TURN_REMINDERS_ENABLED: 'true',
    NOTIFICATION_VERDICT_ALERTS_ENABLED: 'true',

    // AI Bot Settings
    AI_BOT_AUTO_ACCEPT_ENABLED: 'true',
    AI_BOT_RESPONSE_MIN_DELAY: '5',
    AI_BOT_RESPONSE_MAX_DELAY: '15',
    AI_BOT_DEFAULT_PERSONALITY: 'BALANCED',
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()

        // Update state with fetched values (use defaults if not set)
        setSettings((prev) => ({
          VERDICT_TIE_THRESHOLD: data.VERDICT_TIE_THRESHOLD || prev.VERDICT_TIE_THRESHOLD,
          VERDICT_DEADLINE_PENALTY_ENABLED:
            data.VERDICT_DEADLINE_PENALTY_ENABLED || prev.VERDICT_DEADLINE_PENALTY_ENABLED,
          VERDICT_AUTO_GENERATE: data.VERDICT_AUTO_GENERATE || prev.VERDICT_AUTO_GENERATE,

          ADS_PLATFORM_FEE_BRONZE: data.ADS_PLATFORM_FEE_BRONZE || prev.ADS_PLATFORM_FEE_BRONZE,
          ADS_PLATFORM_FEE_SILVER: data.ADS_PLATFORM_FEE_SILVER || prev.ADS_PLATFORM_FEE_SILVER,
          ADS_PLATFORM_FEE_GOLD: data.ADS_PLATFORM_FEE_GOLD || prev.ADS_PLATFORM_FEE_GOLD,
          ADS_PLATFORM_FEE_PLATINUM: data.ADS_PLATFORM_FEE_PLATINUM || prev.ADS_PLATFORM_FEE_PLATINUM,
          ADS_ESCROW_HOLD_DAYS: data.ADS_ESCROW_HOLD_DAYS || prev.ADS_ESCROW_HOLD_DAYS,
          ADS_APPROVAL_REQUIRED: data.ADS_APPROVAL_REQUIRED || prev.ADS_APPROVAL_REQUIRED,
          ADS_CREATOR_MARKETPLACE_ENABLED:
            data.ADS_CREATOR_MARKETPLACE_ENABLED || prev.ADS_CREATOR_MARKETPLACE_ENABLED,

          BELT_FREE_CHALLENGES_PER_WEEK:
            data.BELT_FREE_CHALLENGES_PER_WEEK || prev.BELT_FREE_CHALLENGES_PER_WEEK,
          BELT_CHALLENGE_GRACE_PERIOD_DAYS:
            data.BELT_CHALLENGE_GRACE_PERIOD_DAYS || prev.BELT_CHALLENGE_GRACE_PERIOD_DAYS,
          BELT_AUTO_EXPIRE_ENABLED: data.BELT_AUTO_EXPIRE_ENABLED || prev.BELT_AUTO_EXPIRE_ENABLED,

          TOURNAMENT_AUTO_START_ENABLED:
            data.TOURNAMENT_AUTO_START_ENABLED || prev.TOURNAMENT_AUTO_START_ENABLED,
          TOURNAMENT_AUTO_PROGRESSION_ENABLED:
            data.TOURNAMENT_AUTO_PROGRESSION_ENABLED || prev.TOURNAMENT_AUTO_PROGRESSION_ENABLED,
          TOURNAMENT_MIN_PARTICIPANTS:
            data.TOURNAMENT_MIN_PARTICIPANTS || prev.TOURNAMENT_MIN_PARTICIPANTS,
          TOURNAMENT_DEFAULT_PRIZE_SPLIT:
            data.TOURNAMENT_DEFAULT_PRIZE_SPLIT || prev.TOURNAMENT_DEFAULT_PRIZE_SPLIT,

          NOTIFICATION_EMAIL_ENABLED:
            data.NOTIFICATION_EMAIL_ENABLED || prev.NOTIFICATION_EMAIL_ENABLED,
          NOTIFICATION_PUSH_ENABLED:
            data.NOTIFICATION_PUSH_ENABLED || prev.NOTIFICATION_PUSH_ENABLED,
          NOTIFICATION_TURN_REMINDERS_ENABLED:
            data.NOTIFICATION_TURN_REMINDERS_ENABLED || prev.NOTIFICATION_TURN_REMINDERS_ENABLED,
          NOTIFICATION_VERDICT_ALERTS_ENABLED:
            data.NOTIFICATION_VERDICT_ALERTS_ENABLED || prev.NOTIFICATION_VERDICT_ALERTS_ENABLED,

          AI_BOT_AUTO_ACCEPT_ENABLED:
            data.AI_BOT_AUTO_ACCEPT_ENABLED || prev.AI_BOT_AUTO_ACCEPT_ENABLED,
          AI_BOT_RESPONSE_MIN_DELAY:
            data.AI_BOT_RESPONSE_MIN_DELAY || prev.AI_BOT_RESPONSE_MIN_DELAY,
          AI_BOT_RESPONSE_MAX_DELAY:
            data.AI_BOT_RESPONSE_MAX_DELAY || prev.AI_BOT_RESPONSE_MAX_DELAY,
          AI_BOT_DEFAULT_PERSONALITY:
            data.AI_BOT_DEFAULT_PERSONALITY || prev.AI_BOT_DEFAULT_PERSONALITY,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'System settings have been updated successfully',
      })

      // Refresh settings to confirm changes
      await fetchSettings()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      setSettings({
        VERDICT_TIE_THRESHOLD: '5',
        VERDICT_DEADLINE_PENALTY_ENABLED: 'true',
        VERDICT_AUTO_GENERATE: 'true',
        ADS_PLATFORM_FEE_BRONZE: '25',
        ADS_PLATFORM_FEE_SILVER: '20',
        ADS_PLATFORM_FEE_GOLD: '15',
        ADS_PLATFORM_FEE_PLATINUM: '10',
        ADS_ESCROW_HOLD_DAYS: '7',
        ADS_APPROVAL_REQUIRED: 'true',
        ADS_CREATOR_MARKETPLACE_ENABLED: 'true',
        BELT_FREE_CHALLENGES_PER_WEEK: '3',
        BELT_CHALLENGE_GRACE_PERIOD_DAYS: '7',
        BELT_AUTO_EXPIRE_ENABLED: 'true',
        TOURNAMENT_AUTO_START_ENABLED: 'true',
        TOURNAMENT_AUTO_PROGRESSION_ENABLED: 'true',
        TOURNAMENT_MIN_PARTICIPANTS: '2',
        TOURNAMENT_DEFAULT_PRIZE_SPLIT: '60,30,10',
        NOTIFICATION_EMAIL_ENABLED: 'true',
        NOTIFICATION_PUSH_ENABLED: 'true',
        NOTIFICATION_TURN_REMINDERS_ENABLED: 'true',
        NOTIFICATION_VERDICT_ALERTS_ENABLED: 'true',
        AI_BOT_AUTO_ACCEPT_ENABLED: 'true',
        AI_BOT_RESPONSE_MIN_DELAY: '5',
        AI_BOT_RESPONSE_MAX_DELAY: '15',
        AI_BOT_DEFAULT_PERSONALITY: 'BALANCED',
      })

      showToast({
        type: 'info',
        title: 'Reset to Defaults',
        description: 'Settings reset. Click Save to apply.',
      })
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
        <p className="text-text-secondary">
          Configure core platform features and behavior
        </p>
      </div>

      <div className="space-y-6">
        {/* Verdict Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">⚖️ Verdict Settings</h3>
            <p className="text-sm text-text-secondary">
              Configure AI judge verdict generation and scoring
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tie Threshold (points)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.VERDICT_TIE_THRESHOLD}
                  onChange={(e) =>
                    setSettings({ ...settings, VERDICT_TIE_THRESHOLD: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  If scores are within this many points, verdict is a tie (default: 5)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verdict_deadline_penalty"
                  checked={settings.VERDICT_DEADLINE_PENALTY_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      VERDICT_DEADLINE_PENALTY_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="verdict_deadline_penalty" className="text-sm text-text-primary">
                  Enable deadline penalties for late submissions
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="verdict_auto_generate"
                  checked={settings.VERDICT_AUTO_GENERATE === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      VERDICT_AUTO_GENERATE: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="verdict_auto_generate" className="text-sm text-text-primary">
                  Auto-generate verdicts when debates complete
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Advertisement Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">📢 Advertisement Settings</h3>
            <p className="text-sm text-text-secondary">
              Configure platform fees and escrow handling
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Bronze Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.ADS_PLATFORM_FEE_BRONZE}
                    onChange={(e) =>
                      setSettings({ ...settings, ADS_PLATFORM_FEE_BRONZE: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Silver Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.ADS_PLATFORM_FEE_SILVER}
                    onChange={(e) =>
                      setSettings({ ...settings, ADS_PLATFORM_FEE_SILVER: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Gold Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.ADS_PLATFORM_FEE_GOLD}
                    onChange={(e) =>
                      setSettings({ ...settings, ADS_PLATFORM_FEE_GOLD: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Platinum Fee (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.ADS_PLATFORM_FEE_PLATINUM}
                    onChange={(e) =>
                      setSettings({ ...settings, ADS_PLATFORM_FEE_PLATINUM: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Escrow Hold Period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.ADS_ESCROW_HOLD_DAYS}
                  onChange={(e) =>
                    setSettings({ ...settings, ADS_ESCROW_HOLD_DAYS: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  How long to hold funds before releasing to creator (default: 7 days)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ads_approval_required"
                  checked={settings.ADS_APPROVAL_REQUIRED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ADS_APPROVAL_REQUIRED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="ads_approval_required" className="text-sm text-text-primary">
                  Require admin approval for new ad campaigns
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ads_marketplace_enabled"
                  checked={settings.ADS_CREATOR_MARKETPLACE_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      ADS_CREATOR_MARKETPLACE_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="ads_marketplace_enabled" className="text-sm text-text-primary">
                  Enable Creator Marketplace for ad contracts
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Belt Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">🏆 Belt Challenge Settings</h3>
            <p className="text-sm text-text-secondary">
              Configure belt challenge limits and expiration
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Free Challenges Per Week
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={settings.BELT_FREE_CHALLENGES_PER_WEEK}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      BELT_FREE_CHALLENGES_PER_WEEK: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Number of free belt challenges per user per week (default: 3)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Challenge Grace Period (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.BELT_CHALLENGE_GRACE_PERIOD_DAYS}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      BELT_CHALLENGE_GRACE_PERIOD_DAYS: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Days before unanswered belt challenges expire (default: 7)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="belt_auto_expire"
                  checked={settings.BELT_AUTO_EXPIRE_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      BELT_AUTO_EXPIRE_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="belt_auto_expire" className="text-sm text-text-primary">
                  Automatically expire pending belt challenges
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tournament Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">🏅 Tournament Settings</h3>
            <p className="text-sm text-text-secondary">
              Configure tournament automation and defaults
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Minimum Participants
                </label>
                <input
                  type="number"
                  min="2"
                  max="128"
                  value={settings.TOURNAMENT_MIN_PARTICIPANTS}
                  onChange={(e) =>
                    setSettings({ ...settings, TOURNAMENT_MIN_PARTICIPANTS: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Minimum players required to start tournament (default: 2)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Default Prize Split (%)
                </label>
                <input
                  type="text"
                  placeholder="60,30,10"
                  value={settings.TOURNAMENT_DEFAULT_PRIZE_SPLIT}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      TOURNAMENT_DEFAULT_PRIZE_SPLIT: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Prize distribution for 1st, 2nd, 3rd place (comma-separated, must total 100)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tournament_auto_start"
                  checked={settings.TOURNAMENT_AUTO_START_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      TOURNAMENT_AUTO_START_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="tournament_auto_start" className="text-sm text-text-primary">
                  Auto-start tournaments when full or past start date
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tournament_auto_progression"
                  checked={settings.TOURNAMENT_AUTO_PROGRESSION_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      TOURNAMENT_AUTO_PROGRESSION_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="tournament_auto_progression" className="text-sm text-text-primary">
                  Automatically advance to next round when all matches complete
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">🔔 Notification Settings</h3>
            <p className="text-sm text-text-secondary">
              Control notification delivery channels
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notification_email"
                  checked={settings.NOTIFICATION_EMAIL_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      NOTIFICATION_EMAIL_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="notification_email" className="text-sm text-text-primary">
                  Enable email notifications
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notification_push"
                  checked={settings.NOTIFICATION_PUSH_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      NOTIFICATION_PUSH_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="notification_push" className="text-sm text-text-primary">
                  Enable push notifications (Web Push + FCM)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notification_turn_reminders"
                  checked={settings.NOTIFICATION_TURN_REMINDERS_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      NOTIFICATION_TURN_REMINDERS_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="notification_turn_reminders" className="text-sm text-text-primary">
                  Send turn reminder notifications
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notification_verdict_alerts"
                  checked={settings.NOTIFICATION_VERDICT_ALERTS_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      NOTIFICATION_VERDICT_ALERTS_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="notification_verdict_alerts" className="text-sm text-text-primary">
                  Send verdict result notifications
                </label>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* AI Bot Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-white">🤖 AI Bot Settings</h3>
            <p className="text-sm text-text-secondary">
              Configure AI user bot behavior and timing
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Response Delay Range (minutes)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.AI_BOT_RESPONSE_MIN_DELAY}
                      onChange={(e) =>
                        setSettings({ ...settings, AI_BOT_RESPONSE_MIN_DELAY: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                    />
                    <p className="text-xs text-text-secondary mt-1">Min delay</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.AI_BOT_RESPONSE_MAX_DELAY}
                      onChange={(e) =>
                        setSettings({ ...settings, AI_BOT_RESPONSE_MAX_DELAY: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                    />
                    <p className="text-xs text-text-secondary mt-1">Max delay</p>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  AI bots will respond between {settings.AI_BOT_RESPONSE_MIN_DELAY}-{settings.AI_BOT_RESPONSE_MAX_DELAY} minutes
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Default Personality
                </label>
                <select
                  value={settings.AI_BOT_DEFAULT_PERSONALITY}
                  onChange={(e) =>
                    setSettings({ ...settings, AI_BOT_DEFAULT_PERSONALITY: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-dark-card border border-gray-700 rounded-lg text-white"
                >
                  <option value="BALANCED">Balanced</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                  <option value="DIPLOMATIC">Diplomatic</option>
                  <option value="ANALYTICAL">Analytical</option>
                  <option value="CREATIVE">Creative</option>
                  <option value="SMART">Smart</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ai_bot_auto_accept"
                  checked={settings.AI_BOT_AUTO_ACCEPT_ENABLED === 'true'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      AI_BOT_AUTO_ACCEPT_ENABLED: e.target.checked.toString(),
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="ai_bot_auto_accept" className="text-sm text-text-primary">
                  AI bots auto-accept open challenges
                </label>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-700">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
        <Button variant="secondary" onClick={handleReset} disabled={isLoading}>
          Reset to Defaults
        </Button>
        <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
          Reload Settings
        </Button>
      </div>
    </div>
  )
}
