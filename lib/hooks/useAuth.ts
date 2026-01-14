'use client'

import { useState, useEffect } from 'react'

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
  coins?: number
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUser()
    
    // Listen for login events to refetch user
    const handleLogin = () => {
      console.log('[useAuth] Login event detected, refetching user...')
      fetchUser()
    }
    
    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-refresh') {
        console.log('[useAuth] Storage change detected, refetching user...')
        fetchUser()
      }
    }
    
    window.addEventListener('user-logged-in', handleLogin)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('user-logged-in', handleLogin)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const fetchUser = async () => {
    try {
      // Add cache-busting timestamp to prevent stale responses
      const response = await fetch(`/api/auth/me?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // DEBUG: Log what we received
        console.log('[useAuth] Received user data:', {
          id: data.user?.id,
          email: data.user?.email,
          username: data.user?.username,
          isAdmin: data.user?.isAdmin,
        })
        
        // Normalize user data - handle both camelCase and snake_case
        if (data.user) {
          const normalizedUser = {
            ...data.user,
            avatarUrl: data.user.avatarUrl || data.user.avatar_url || null,
            eloRating: data.user.eloRating || data.user.elo_rating || 0,
            debatesWon: data.user.debatesWon || data.user.debates_won || 0,
            debatesLost: data.user.debatesLost || data.user.debates_lost || 0,
            debatesTied: data.user.debatesTied || data.user.debates_tied || 0,
            totalDebates: data.user.totalDebates || data.user.total_debates || 0,
            totalScore: data.user.totalScore || data.user.total_score || 0,
            totalMaxScore: data.user.totalMaxScore || data.user.total_max_score || 0,
            isCreator: data.user.isCreator || data.user.is_creator || false,
            coins: data.user.coins !== undefined ? data.user.coins : 0,
          }
          
          // DEBUG: Log what we're setting
          console.log('[useAuth] Setting user state:', {
            id: normalizedUser.id,
            email: normalizedUser.email,
            username: normalizedUser.username,
            isAdmin: normalizedUser.isAdmin,
          })
          
          setUser(normalizedUser)
        } else {
          console.log('[useAuth] No user in response, setting user to null')
          setUser(null)
        }
      } else if (response.status === 401) {
        // 401 is expected when user is not logged in - not an error
        // Don't log this as it's normal behavior for logged-out users
        setUser(null)
      } else {
        console.error('[useAuth] Error response:', response.status, response.statusText)
        setUser(null)
      }
    } catch (error) {
      console.error('[useAuth] Fetch error:', error)
      // Silently handle errors - 401 is expected for logged-out users
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch: fetchUser,
    logout,
  }
}

