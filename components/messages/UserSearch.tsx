'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/Input'
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

interface UserSearchProps {
  conversations: Conversation[]
  onOpenConversation: (conversation: Conversation) => void
  onStartConversation: (userId: string) => void
}

export function UserSearch({ conversations, onOpenConversation, onStartConversation }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (!response.ok) throw new Error('Search failed')
        const data = await response.json()
        const users = Array.isArray(data) ? data : (data.users || [])
        setSearchResults(users)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  return (
    <div className="p-4">
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for users..."
        className="mb-4"
      />
      {isSearching ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : searchResults.length === 0 && searchQuery.trim() ? (
        <div className="text-center text-text-secondary py-8">
          <p>No users found</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="space-y-2">
          {searchResults.map((user) => {
            const existingConv = conversations.find(
              conv => conv.otherUser.id === user.id
            )
            return (
              <div
                key={user.id}
                className="p-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user.avatarUrl}
                    username={user.username}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.username}
                    </p>
                    {user.eloRating !== undefined && (
                      <p className="text-sm text-text-secondary">
                        ELO: {user.eloRating}
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
                        onStartConversation(user.id)
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
      ) : (
        <div className="text-center text-text-secondary py-8">
          <p>Search for users to start a conversation</p>
          <p className="text-sm mt-2">Type at least 2 characters</p>
        </div>
      )}
    </div>
  )
}
