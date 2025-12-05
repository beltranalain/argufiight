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
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
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
          }
          setUser(normalizedUser)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
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

