'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface User {
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
}

interface UserSearchInputProps {
  selectedUsers: User[]
  onUsersChange: (users: User[]) => void
  maxUsers?: number
  placeholder?: string
  allowMultiple?: boolean
}

export function UserSearchInput({
  selectedUsers,
  onUsersChange,
  maxUsers = 10,
  placeholder = 'Search for users...',
  allowMultiple = true,
}: UserSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search users with debounce
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
        // Extract users array from paginated response
        const users = Array.isArray(data) ? data : (data.users || [])
        // Filter out already selected users
        const filtered = users.filter(
          (user: User) => !selectedUsers.some(selected => selected.id === user.id)
        )
        setSearchResults(filtered)
        setShowResults(true)
      } catch (error) {
        console.error('User search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) as any as number

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedUsers])

  const handleSelectUser = (user: User) => {
    if (!allowMultiple) {
      onUsersChange([user])
      setSearchQuery('')
      setShowResults(false)
      return
    }

    if (selectedUsers.length >= maxUsers) {
      return
    }

    if (!selectedUsers.some(u => u.id === user.id)) {
      onUsersChange([...selectedUsers, user])
      setSearchQuery('')
      setShowResults(false)
    }
  }

  const handleRemoveUser = (userId: string) => {
    onUsersChange(selectedUsers.filter(u => u.id !== userId))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-electric-blue/20 border border-electric-blue/30 rounded-lg"
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.username}
                size="sm"
              />
              <span className="text-sm text-white font-medium">{user.username}</span>
              {allowMultiple && (
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {searchResults.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectUser(user)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-bg-tertiary transition-colors text-left"
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue">
                    ELO: {user.eloRating}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl p-4 text-center text-text-secondary">
          No users found
        </div>
      )}
    </div>
  )
}

