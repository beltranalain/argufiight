'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
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

interface AccountSwitcherProps {
  onClose?: () => void
}

export function AccountSwitcher({ onClose }: AccountSwitcherProps) {
  const { user, refetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
        if (onClose) onClose()
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

  const removeAccount = async (userId: string, username: string) => {
    // Don't allow removing the current account
    if (userId === user?.id) {
      alert('Cannot remove the currently active account. Please switch to another account first.')
      return
    }

    try {
      console.log('[AccountSwitcher] Removing account:', { userId, username })
      
      // Find the session for this user
      const sessionToRemove = sessions.find(s => s.user.id === userId)
      
      // Delete session from database if it exists
      if (sessionToRemove && sessionToRemove.token && !sessionToRemove.id.startsWith('temp-')) {
        try {
          console.log('[AccountSwitcher] Deleting session from database:', sessionToRemove.token.substring(0, 20) + '...')
          const response = await fetch('/api/auth/sessions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionToken: sessionToRemove.token }),
          })
          
          if (!response.ok) {
            const data = await response.json()
            console.error('[AccountSwitcher] Failed to delete session:', data.error)
            // Continue anyway - at least remove from localStorage
          } else {
            console.log('[AccountSwitcher] Session deleted from database successfully')
          }
        } catch (error) {
          console.error('[AccountSwitcher] Error deleting session:', error)
          // Continue anyway - at least remove from localStorage
        }
      }
      
      // Remove from localStorage
      removeLinkedAccount(userId)
      console.log('[AccountSwitcher] Removed from localStorage')
      
      // Refresh the sessions list
      await fetchSessions()
      console.log('[AccountSwitcher] Account removed successfully')
    } catch (error) {
      console.error('[AccountSwitcher] Failed to remove account:', error)
      alert('Failed to remove account. Please try again.')
    }
  }

  if (!user) {
    return null
  }

  return (
    <Modal isOpen={true} onClose={onClose || (() => {})} title="Switch Account">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
        </p>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {sessions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-text-secondary text-sm mb-3">
                No linked accounts. Add an existing account to switch between them.
              </p>
              <Button
                onClick={() => {
                  window.location.href = '/login?addAccount=true'
                }}
                variant="primary"
                className="w-full"
              >
                Add an existing account
              </Button>
            </div>
          ) : (
            <>
              {sessions.map((session) => {
              const isCurrent = session.user.id === user.id
              const needsLogin = !session.token || session.id.startsWith('temp-')
              return (
                <div
                  key={session.id}
                  className={`w-full p-3 flex items-center gap-3 rounded-lg border transition-colors ${
                    isCurrent 
                      ? 'bg-electric-blue/10 border-electric-blue/30' 
                      : 'border-bg-tertiary hover:bg-bg-tertiary'
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
                      isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
                      <span className="text-xs text-electric-blue font-medium px-2 py-1 bg-electric-blue/20 rounded">
                        Current
                      </span>
                    )}
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Remove ${session.user.username} from linked accounts?`)) {
                          removeAccount(session.user.id, session.user.username)
                        }
                      }}
                      className="text-text-secondary hover:text-neon-orange p-1 text-lg font-bold transition-colors"
                      title="Remove account"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
            <div className="p-3 border-t border-bg-tertiary">
              <Button
                onClick={() => {
                  window.location.href = '/login?addAccount=true'
                }}
                variant="secondary"
                className="w-full"
              >
                + Add an existing account
              </Button>
            </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

