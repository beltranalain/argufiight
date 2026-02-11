'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

// All notification types from the schema
const NOTIFICATION_TYPES = [
  {
    type: 'DEBATE_TURN',
    label: "It's Your Turn",
    description: 'Sent when it\'s a user\'s turn to submit an argument',
    category: 'Debate Activity',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_ACCEPTED',
    label: 'Challenge Accepted',
    description: 'Sent when someone accepts your debate challenge',
    category: 'Debate Activity',
    defaultEnabled: true,
  },
  {
    type: 'ROUND_ENDING',
    label: 'Round Ending Soon',
    description: 'Sent when a debate round is about to end',
    category: 'Debate Activity',
    defaultEnabled: true,
  },
  {
    type: 'VERDICT_READY',
    label: 'Verdict Ready',
    description: 'Sent when AI judges have completed their verdict',
    category: 'Debate Results',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_WON',
    label: 'Debate Won',
    description: 'Sent when a user wins a debate',
    category: 'Debate Results',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_LOST',
    label: 'Debate Lost',
    description: 'Sent when a user loses a debate',
    category: 'Debate Results',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_TIED',
    label: 'Debate Tied',
    description: 'Sent when a debate ends in a tie',
    category: 'Debate Results',
    defaultEnabled: true,
  },
  {
    type: 'NEW_CHALLENGE',
    label: 'New Challenge',
    description: 'Sent when someone challenges you to a debate',
    category: 'Challenges',
    defaultEnabled: true,
  },
  {
    type: 'OPPONENT_SUBMITTED',
    label: 'Opponent Submitted',
    description: 'Sent when your opponent submits their argument',
    category: 'Debate Activity',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_INVITATION',
    label: 'Debate Invitation',
    description: 'Sent when you receive a direct debate invitation',
    category: 'Challenges',
    defaultEnabled: true,
  },
  {
    type: 'DEBATE_GROUP_INVITATION',
    label: 'Group Challenge Invitation',
    description: 'Sent when you\'re invited to a group challenge',
    category: 'Challenges',
    defaultEnabled: true,
  },
  {
    type: 'REMATCH_REQUESTED',
    label: 'Rematch Requested',
    description: 'Sent when someone requests a rematch',
    category: 'Challenges',
    defaultEnabled: true,
  },
  {
    type: 'REMATCH_ACCEPTED',
    label: 'Rematch Accepted',
    description: 'Sent when a rematch request is accepted',
    category: 'Challenges',
    defaultEnabled: true,
  },
  {
    type: 'REMATCH_DECLINED',
    label: 'Rematch Declined',
    description: 'Sent when a rematch request is declined',
    category: 'Challenges',
    defaultEnabled: false,
  },
  {
    type: 'NEW_MESSAGE',
    label: 'New Message',
    description: 'Sent when you receive a direct message',
    category: 'Messages',
    defaultEnabled: true,
  },
]

interface PreferencesResponse {
  preferences: Record<string, boolean>
}

function getDefaults(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {}
  NOTIFICATION_TYPES.forEach((nt) => {
    defaults[nt.type] = nt.defaultEnabled
  })
  return defaults
}

export default function NotificationManagementPage() {
  const { showToast } = useToast()
  const [preferences, setPreferences] = useState<Record<string, boolean>>(getDefaults())

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'notifications', 'preferences'],
    queryFn: () => fetchClient<PreferencesResponse>('/api/admin/notifications/preferences'),
    select: (data) => {
      const merged: Record<string, boolean> = {}
      NOTIFICATION_TYPES.forEach((nt) => {
        merged[nt.type] = data.preferences?.[nt.type] ?? nt.defaultEnabled
      })
      setPreferences(merged)
      return merged
    },
  })

  const saveMutation = useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      fetchClient<void>('/api/admin/notifications/preferences', {
        method: 'POST',
        body: JSON.stringify({ preferences: prefs }),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Preferences Saved',
        description: 'Notification preferences have been updated successfully',
      })
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to save notification preferences',
      })
    },
  })

  const handleToggle = (type: string) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  const handleEnableAll = () => {
    const allEnabled: Record<string, boolean> = {}
    NOTIFICATION_TYPES.forEach((nt) => {
      allEnabled[nt.type] = true
    })
    setPreferences(allEnabled)
  }

  const handleDisableAll = () => {
    const allDisabled: Record<string, boolean> = {}
    NOTIFICATION_TYPES.forEach((nt) => {
      allDisabled[nt.type] = false
    })
    setPreferences(allDisabled)
  }

  const handleResetDefaults = () => {
    setPreferences(getDefaults())
  }

  // Group by category
  const grouped = NOTIFICATION_TYPES.reduce((acc, nt) => {
    if (!acc[nt.category]) {
      acc[nt.category] = []
    }
    acc[nt.category].push(nt)
    return acc
  }, {} as Record<string, typeof NOTIFICATION_TYPES>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load notification preferences"
        message={error.message}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notification Management</h1>
          <p className="text-text-secondary">
            Control which push notifications are sent to users
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={handleEnableAll}>
            Enable All
          </Button>
          <Button variant="secondary" onClick={handleDisableAll}>
            Disable All
          </Button>
          <Button variant="secondary" onClick={handleResetDefaults}>
            Reset Defaults
          </Button>
          <Button variant="primary" onClick={() => saveMutation.mutate(preferences)} isLoading={saveMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Push Notification Preferences</h2>
          <p className="text-sm text-text-secondary mt-1">
            Toggle notification types on or off. Disabled notifications will not be sent as push notifications.
            In-app notifications will still be created.
          </p>
        </CardHeader>
        <CardBody>
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, types]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-bg-tertiary">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {types.map((nt) => (
                    <div
                      key={nt.type}
                      className="flex items-start justify-between p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{nt.label}</h4>
                          {preferences[nt.type] ? (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                              Enabled
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">{nt.description}</p>
                        <code className="text-xs text-text-muted mt-1 block">{nt.type}</code>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={preferences[nt.type] ?? nt.defaultEnabled}
                          onChange={() => handleToggle(nt.type)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
        <p className="text-sm text-electric-blue">
          <strong>Note:</strong> When a notification type is disabled, push notifications will not be sent,
          but in-app notifications will still be created in the database. Users can still see these
          notifications in their notification center.
        </p>
      </div>
    </div>
  )
}
