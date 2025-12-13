'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { BattleHistory } from '@/components/profile/BattleHistory'
import { CreatorCTA } from '@/components/profile/CreatorCTA'
import { AdDisplay } from '@/components/ads/AdDisplay'

interface UserProfile {
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
  totalWordCount: number
  totalStatements: number
  averageWordCount: number
  averageRounds: number
  createdAt: string
}

interface TournamentStats {
  totalTournaments: number
  completedTournaments: number
  activeTournaments: number
  championships: number
  totalTournamentWins: number
  totalTournamentLosses: number
  winRate: number
  bestFinish: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading, refetch } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null)

  // Redirect to username-based URL once user is loaded
  useEffect(() => {
    if (!authLoading && user?.username) {
      // Use replace to avoid adding to history
      router.replace(`/${user.username}`)
    } else if (!authLoading && !user) {
      // Not logged in, redirect to home
      router.replace('/')
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        setFormData({
          username: data.user.username || '',
          bio: data.user.bio || '',
        })
        setAvatarPreview(data.user.avatarUrl)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTournamentStats = async () => {
    try {
      const response = await fetch('/api/profile/tournament-stats')
      if (response.ok) {
        const data = await response.json()
        setTournamentStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch tournament stats:', error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          title: 'Invalid File',
          description: 'Please select an image file',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
        })
        return
      }

      setAvatarFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }

      const data = await response.json()
      setAvatarPreview(data.avatarUrl)
      setAvatarFile(null)
      
      showToast({
        type: 'success',
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated',
      })

      refetch()
      fetchProfile()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload avatar',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      showToast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been saved',
      })

      refetch()
      fetchProfile()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading while redirecting
  if (authLoading || !user?.username) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // This should not render as we redirect, but just in case
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="PROFILE" />
      <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}

