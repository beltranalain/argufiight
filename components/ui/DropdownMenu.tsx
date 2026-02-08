'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  isHeader?: boolean // For non-clickable header items like coin balance
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
  header?: React.ReactNode // Optional header content (e.g., coin balance)
}

export function DropdownMenu({ trigger, items, align = 'right', header }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Menu */}
      <div
        className={cn(
          'absolute top-full mt-2 min-w-[200px] bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl py-2 z-50 transition-all duration-150 origin-top',
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none',
          align === 'right' ? 'right-0' : 'left-0'
        )}
      >
        {header && (
          <div className="px-4 py-2 border-b border-bg-tertiary">
            {header}
          </div>
        )}
        {items.map((item, index) => (
          item.isHeader ? (
            <div
              key={index}
              className="w-full px-4 py-2 text-text-secondary text-sm font-medium border-b border-bg-tertiary"
            >
              {item.label}
            </div>
          ) : (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick()
                  setIsOpen(false)
                }
              }}
              disabled={item.disabled}
              className={cn(
                'w-full px-4 py-2 text-left flex items-center gap-3 transition-colors',
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.variant === 'danger'
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-text-primary hover:bg-bg-tertiary'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          )
        ))}
      </div>
    </div>
  )
}
