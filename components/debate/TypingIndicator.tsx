'use client'

import { Avatar } from '@/components/ui/Avatar'

interface TypingUser {
  id: string
  username: string
  avatarUrl: string | null
}

interface TypingIndicatorProps {
  users: TypingUser[]
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  // Show up to 3 users typing
  const displayUsers = users.slice(0, 3)
  const remainingCount = users.length - 3

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {displayUsers.map((user) => (
        <Avatar
          key={user.id}
          src={user.avatarUrl}
          username={user.username}
          size="xs"
        />
      ))}
      <div className="flex items-center gap-1 bg-bg-tertiary rounded-full px-3 py-1.5">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-text-muted ml-2">
          {users.length === 1
            ? `${users[0].username} is typing...`
            : users.length === 2
            ? `${users[0].username} and ${users[1].username} are typing...`
            : remainingCount > 0
            ? `${displayUsers.map(u => u.username).join(', ')}, and ${remainingCount} more are typing...`
            : `${displayUsers.map(u => u.username).join(', ')} are typing...`}
        </span>
      </div>
    </div>
  )
}

