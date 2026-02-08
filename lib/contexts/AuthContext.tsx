'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface User {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  bio: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
  totalScore: number
  totalMaxScore: number
  isAdmin: boolean
  isBanned: boolean
  isCreator?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function normalizeUser(data: any): User {
  return {
    ...data,
    avatarUrl: data.avatarUrl || data.avatar_url || null,
    eloRating: data.eloRating || data.elo_rating || 0,
    debatesWon: data.debatesWon || data.debates_won || 0,
    debatesLost: data.debatesLost || data.debates_lost || 0,
    debatesTied: data.debatesTied || data.debates_tied || 0,
    totalDebates: data.totalDebates || data.total_debates || 0,
    totalScore: data.totalScore || data.total_score || 0,
    totalMaxScore: data.totalMaxScore || data.total_max_score || 0,
    isCreator: data.isCreator || data.is_creator || false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(normalizeUser(data.user))
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()

    const handleLogin = () => fetchUser()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-refresh') fetchUser()
    }

    window.addEventListener('user-logged-in', handleLogin)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('user-logged-in', handleLogin)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUser])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      refetch: fetchUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
