import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  username?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ 
  src, 
  alt = 'User avatar',
  username,
  size = 'md',
  className,
}: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  }

  // Generate solid color based on username
  const getColor = (name?: string) => {
    if (!name) return 'bg-electric-blue'
    
    const colors = [
      'bg-electric-blue',
      'bg-hot-pink',
      'bg-cyber-green',
      'bg-neon-orange',
      'bg-electric-blue',
    ]
    
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold overflow-hidden',
        sizes[size],
        !src && getColor(username),
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={username ? 'text-black' : 'text-white'}>
          {getInitials(username)}
        </span>
      )}
    </div>
  )
}

