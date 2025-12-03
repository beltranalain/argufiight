# PART 4: UI COMPONENTS LIBRARY

Complete reusable component library matching the cyberpunk design system.

---

## OVERVIEW

This part covers:
- Core UI components (Card, Modal, Badge, etc.)
- All matching cyberpunk aesthetic
- TypeScript + Tailwind
- Production-ready, accessible components

---

## COMPONENTS TO BUILD

1. Card
2. Modal/Dialog
3. Badge
4. Avatar
5. Tabs
6. Dropdown Menu
7. Loading Spinner
8. Empty State
9. Toast Notifications
10. Tooltip

---

## CURSOR.AI PROMPTS

### PROMPT 1: Card Component

```
Create a Card component matching the cyberpunk design system:

File: components/ui/Card.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
  glow?: boolean
}

export function Card({ 
  children, 
  variant = 'default',
  hover = false,
  glow = false,
  className,
  ...props 
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300'
  
  const variants = {
    default: 'bg-bg-secondary border border-bg-tertiary',
    bordered: 'bg-transparent border-2 border-bg-tertiary',
    elevated: 'bg-bg-secondary shadow-lg',
  }
  
  const hoverStyles = hover ? 'hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)] hover:-translate-y-1' : ''
  const glowStyles = glow ? 'shadow-[0_0_20px_rgba(0,217,255,0.3)]' : ''

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverStyles,
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-bg-tertiary', className)} {...props}>
      {children}
    </div>
  )
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('p-6 border-t border-bg-tertiary', className)} {...props}>
      {children}
    </div>
  )
}
```

---

### PROMPT 2: Modal/Dialog Component

```
Create a Modal component with backdrop and animations:

File: components/ui/Modal.tsx

'use client'

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'relative bg-bg-secondary border border-bg-tertiary rounded-2xl shadow-2xl w-full',
              sizeClasses[size]
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between p-6 border-b border-bg-tertiary">
                {title && (
                  <h2 className="text-xl font-bold text-white">{title}</h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="text-text-secondary hover:text-white transition-colors"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-bg-tertiary">
      {children}
    </div>
  )
}
```

---

### PROMPT 3: Badge Component

```
Create a Badge component with category color variants:

File: components/ui/Badge.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sports' | 'politics' | 'tech' | 'entertainment' | 'science' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className,
  ...props 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-bold rounded-full transition-colors'
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }
  
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary',
    sports: 'bg-gradient-to-r from-electric-blue to-neon-orange text-black',
    politics: 'bg-gradient-to-r from-hot-pink to-electric-blue text-white',
    tech: 'bg-gradient-to-r from-cyber-green to-electric-blue text-black',
    entertainment: 'bg-gradient-to-r from-hot-pink to-neon-orange text-white',
    science: 'bg-gradient-to-r from-electric-blue to-cyber-green text-black',
    success: 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30',
    warning: 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30',
    error: 'bg-red-500/20 text-red-500 border border-red-500/30',
  }

  return (
    <span
      className={cn(
        baseStyles,
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

---

### PROMPT 4: Avatar Component

```
Create an Avatar component with gradient backgrounds:

File: components/ui/Avatar.tsx

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

  // Generate gradient based on username
  const getGradient = (name?: string) => {
    if (!name) return 'from-electric-blue to-neon-orange'
    
    const gradients = [
      'from-electric-blue to-neon-orange',
      'from-hot-pink to-cyber-green',
      'from-cyber-green to-electric-blue',
      'from-hot-pink to-electric-blue',
      'from-neon-orange to-hot-pink',
    ]
    
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
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
        !src && `bg-gradient-to-br ${getGradient(username)}`,
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
        <span className={!src && username ? 'text-black' : 'text-white'}>
          {getInitials(username)}
        </span>
      )}
    </div>
  )
}
```

---

### PROMPT 5: Tabs Component

```
Create a Tabs component with animated indicator:

File: components/ui/Tabs.tsx

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  content: React.ReactNode
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
}

export function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id)

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content

  return (
    <div>
      {/* Tab Headers */}
      <div className="border-b border-bg-tertiary">
        <div className="flex gap-1 relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'relative px-4 py-3 font-medium transition-colors flex items-center gap-2',
                activeTab === tab.id
                  ? 'text-electric-blue'
                  : 'text-text-secondary hover:text-white'
              )}
            >
              {tab.icon}
              {tab.label}
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTabContent}
      </div>
    </div>
  )
}
```

---

### PROMPT 6: Dropdown Menu Component

```
Create a Dropdown Menu component:

File: components/ui/DropdownMenu.tsx

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full mt-2 min-w-[200px] bg-bg-secondary border border-bg-tertiary rounded-lg shadow-xl py-2 z-50',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {items.map((item, index) => (
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
                    : 'text-white hover:bg-bg-tertiary'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

### PROMPT 7: Loading Spinner Component

```
Create loading spinner components:

File: components/ui/Loading.tsx

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div
      className={cn(
        'inline-block rounded-full border-electric-blue border-t-transparent animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-white font-medium">{message}</p>
      </div>
    </div>
  )
}

interface LoadingCardProps {
  lines?: number
}

export function LoadingCard({ lines = 3 }: LoadingCardProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-bg-tertiary rounded w-full mb-3" />
      ))}
    </div>
  )
}
```

---

### PROMPT 8: Empty State Component

```
Create an empty state component:

File: components/ui/EmptyState.tsx

import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
      )}
      
      <h3 className="text-xl font-bold text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-text-secondary max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

---

### PROMPT 9: Toast Notification System

```
Create a toast notification system:

File: components/ui/Toast.tsx

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={cn(
                'min-w-[300px] bg-bg-secondary border rounded-lg p-4 shadow-lg',
                toast.type === 'success' && 'border-cyber-green',
                toast.type === 'error' && 'border-red-500',
                toast.type === 'warning' && 'border-neon-orange',
                toast.type === 'info' && 'border-electric-blue'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {toast.type === 'success' && (
                    <svg className="w-5 h-5 text-cyber-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {toast.type === 'error' && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  {toast.type === 'warning' && (
                    <svg className="w-5 h-5 text-neon-orange" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                  {toast.type === 'info' && (
                    <svg className="w-5 h-5 text-electric-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{toast.title}</h4>
                  {toast.description && (
                    <p className="text-sm text-text-secondary mt-1">{toast.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-text-secondary hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
```

---

### PROMPT 10: Tooltip Component

```
Create a tooltip component:

File: components/ui/Tooltip.tsx

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${positions[position]} z-50 pointer-events-none`}
          >
            <div className="bg-bg-primary border border-electric-blue text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## IMPLEMENTATION ORDER

Run these prompts in Cursor.ai in order:

1. Prompt 1: Card Component
2. Prompt 2: Modal Component
3. Prompt 3: Badge Component
4. Prompt 4: Avatar Component
5. Prompt 5: Tabs Component
6. Prompt 6: Dropdown Menu
7. Prompt 7: Loading Components
8. Prompt 8: Empty State
9. Prompt 9: Toast Notifications
10. Prompt 10: Tooltip

---

## ADD TOAST PROVIDER

After creating all components, wrap your app with ToastProvider:

File: app/layout.tsx

```typescript
import { ToastProvider } from '@/components/ui/Toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
```

---

## USAGE EXAMPLES

These are in the prompts for documentation. Each component is ready to use!

PART 4 COMPLETE!
