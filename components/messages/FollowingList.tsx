'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Avatar } from '@/components/ui/Avatar'
import type { Conversation } from '@/lib/hooks/queries/useMessages'

interface User {
  id: string
  username: string
  avatarUrl: string | null
  eloRating?: number
}

interface FollowingListProps {
  userId: string
  conversations: Conversation[]
  onOpenConversation: (conversation: Conversation) => void
  onStartConversation: (userId: string) => void
}

export function FollowingList({ userId, conversations, onOpenConversation, onStartConversation }: FollowingListProps) {
  const [following, setFollowing] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/following?userId=${userId}`)
        if (response.ok) {
          const data = await response.json()
          setFollowing(data || [])
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    fetchFollowing()
  }, [userId])

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (following.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary">
        <p>You&apos;re not following anyone yet</p>
        <p className="text-sm mt-2">Follow users from their profiles to message them</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-bg-tertiary">
      {following.map((followedUser) => {
        const existingConv = conversations.find(
          conv => conv.otherUser.id === followedUser.id
        )
        return (
          <div
            key={followedUser.id}
            className="p-4 hover:bg-bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={followedUser.avatarUrl}
                username={followedUser.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {followedUser.username}
                </p>
                {followedUser.eloRating !== undefined && (
                  <p className="text-sm text-text-secondary">
                    ELO: {followedUser.eloRating}
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (existingConv) {
                    onOpenConversation(existingConv)
                  } else {
                    onStartConversation(followedUser.id)
                  }
                }}
              >
                {existingConv ? 'Open' : 'Message'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
