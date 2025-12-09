'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

interface Session {
  id: string
  token: string
  createdAt: string
  expiresAt: string
  user: {
    id: string
    email: string
    username: string
    avatarUrl: string | null
    isAdmin: boolean
  }
}

// Store linked accounts in localStorage (browser-specific, like Twitter)
const LINKED_ACCOUNTS_KEY = 'argufight_linked_accounts'

function getLinkedAccounts(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(LINKED_ACCOUNTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addLinkedAccount(userId: string) {
  if (typeof window === 'undefined') return
  const accounts = getLinkedAccounts()
  if (!accounts.includes(userId)) {
    accounts.push(userId)
    localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(accounts))
  }
}

function removeLinkedAccount(userId: string) {
  if (typeof window === 'undefined') return
  const accounts = getLinkedAccounts()
  const filtered = accounts.filter(id => id !== userId)
  localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(filtered))
}

export function AccountSwitcher() {
  const { user, refetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (user) {
      // Add current user to linked accounts
      addLinkedAccount(user.id)
      fetchSessions()
    }
  }, [user])

  // Check for account added notification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('accountAdded') === 'true') {
        // Refresh the sessions list
        fetchSessions()
        // Remove the query parameter
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [])

  const fetchSessions = async () => {
    try {
      const linkedAccountIds = getLinkedAccounts()
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'x-linked-accounts': JSON.stringify(linkedAccountIds),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    }
  }

  const switchAccount = async (session: Session) => {
    setIsLoading(true)
    try {
      // If session token is empty, the account needs re-login
      if (!session.token || session.id.startsWith('temp-')) {
        // Redirect to login with a flag to add account
        window.location.href = `/login?addAccount=true&userId=${session.user.id}`
        return
      }

      const response = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: session.token }),
      })

      if (response.ok) {
        // Add to linked accounts if not already there
        addLinkedAccount(session.user.id)
        // Refresh user data
        await refetch()
        setIsOpen(false)
        // Reload page to ensure all components update
        window.location.reload()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to switch account')
      }
    } catch (error) {
      console.error('Failed to switch account:', error)
      alert('Failed to switch account')
    } finally {
      setIsLoading(false)
    }
  }

  const removeAccount = (userId: string) => {
    removeLinkedAccount(userId)
    fetchSessions()
  }

  if (!user || sessions.length <= 1) {
    // Don't show switcher if user has only one account
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Avatar src={user.avatarUrl} alt={user.username} size="sm" />
        <span className="text-xs">{sessions.length} accounts</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-lg z-50">
            <div className="p-3 border-b border-bg-tertiary">
              <p className="text-sm font-semibold text-text-primary">Switch Account</p>
              <p className="text-xs text-text-secondary mt-1">
                {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {sessions.map((session) => {
                const isCurrent = session.user.id === user.id
                const needsLogin = !session.token || session.id.startsWith('temp-')
                return (
                  <div
                    key={session.id}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-bg-tertiary transition-colors ${
                      isCurrent ? 'bg-electric-blue/10' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (!isCurrent) {
                          switchAccount(session)
                        }
                      }}
                      disabled={isCurrent || isLoading}
                      className={`flex-1 flex items-center gap-3 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Avatar
                        src={session.user.avatarUrl}
                        alt={session.user.username}
                        size="sm"
                      />
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {session.user.username}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {session.user.email}
                        </p>
                        {needsLogin && (
                          <p className="text-xs text-neon-orange mt-1">
                            Re-login required
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="text-xs text-electric-blue">Current</span>
                      )}
                    </button>
                    {!isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Remove ${session.user.username} from linked accounts?`)) {
                            removeAccount(session.user.id)
                          }
                        }}
                        className="text-text-secondary hover:text-neon-orange p-1"
                        title="Remove account"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="p-3 border-t border-bg-tertiary">
              <button
                onClick={() => {
                  window.location.href = '/login?addAccount=true'
                }}
                className="w-full text-sm text-electric-blue hover:text-neon-orange text-center"
              >
                + Add another account
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

