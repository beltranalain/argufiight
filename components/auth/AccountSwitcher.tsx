'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { motion, AnimatePresence } from 'framer-motion'

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

  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null)

  const removeAccount = async (userId: string, username: string) => {
    // Don't allow removing the current account
    if (userId === user?.id) {
      alert('Cannot remove the currently active account. Please switch to another account first.')
      return
    }

    setRemovingUserId(userId)
    
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
            throw new Error(data.error || 'Failed to delete session')
          } else {
            console.log('[AccountSwitcher] Session deleted from database successfully')
          }
        } catch (error) {
          console.error('[AccountSwitcher] Error deleting session:', error)
          throw error
        }
      }
      
      // Remove from localStorage
      removeLinkedAccount(userId)
      console.log('[AccountSwitcher] Removed from localStorage')
      
      // Refresh the sessions list
      await fetchSessions()
      console.log('[AccountSwitcher] Account removed successfully')
      
      // Close confirmation dialog
      setShowRemoveConfirm(null)
    } catch (error) {
      console.error('[AccountSwitcher] Failed to remove account:', error)
      alert('Failed to remove account. Please try again.')
    } finally {
      setRemovingUserId(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Dropdown */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="fixed right-4 top-20 mt-2 w-80 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-bg-tertiary">
          <p className="text-sm font-semibold text-text-primary">Switch Account</p>
          <p className="text-xs text-text-secondary mt-1">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-text-secondary text-sm mb-3">
                No linked accounts. Add an existing account to switch between them.
              </p>
              <button
                onClick={() => {
                  window.location.href = '/login?addAccount=true'
                }}
                className="px-4 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-[#00B8E6] transition-colors text-sm"
              >
                Add an existing account
              </button>
            </div>
          ) : (
            <>
              {sessions.map((session) => {
              const isCurrent = session.user.id === user.id
              const needsLogin = !session.token || session.id.startsWith('temp-')
              const isRemoving = removingUserId === session.user.id
              const showConfirm = showRemoveConfirm === session.user.id
              
              return (
                <div key={session.id}>
                  <div
                    className={`w-full p-3 flex items-center gap-3 hover:bg-bg-tertiary transition-colors ${
                      isCurrent ? 'bg-electric-blue/10' : ''
                    } ${isRemoving ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={() => {
                        if (!isCurrent && !isRemoving) {
                          switchAccount(session)
                        }
                      }}
                      disabled={isCurrent || isLoading || isRemoving}
                      className={`flex-1 flex items-center gap-3 ${
                        isLoading || isRemoving ? 'opacity-50 cursor-not-allowed' : ''
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
                        <span className="text-xs text-electric-blue font-medium">Current</span>
                      )}
                    </button>
                    {!isCurrent && !showConfirm && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowRemoveConfirm(session.user.id)
                        }}
                        disabled={isRemoving}
                        className="text-text-secondary hover:text-neon-orange p-1 text-lg transition-colors"
                        title="Remove account"
                      >
                        ×
                      </button>
                    )}
                    {showConfirm && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeAccount(session.user.id, session.user.username)
                          }}
                          disabled={isRemoving}
                          className="px-2 py-1 text-xs bg-neon-orange text-black rounded hover:bg-[#FF6B35] transition-colors"
                        >
                          {isRemoving ? 'Removing...' : 'Confirm'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowRemoveConfirm(null)
                          }}
                          disabled={isRemoving}
                          className="px-2 py-1 text-xs bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="p-3 border-t border-bg-tertiary">
              <button
                onClick={() => {
                  window.location.href = '/login?addAccount=true'
                }}
                className="w-full text-sm text-electric-blue hover:text-neon-orange text-center py-2 font-medium"
              >
                + Add an existing account
              </button>
            </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}

