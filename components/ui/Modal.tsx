'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'large'
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
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Save current scroll position before locking
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      // Restore scroll position when closing
      const scrollY = document.body.style.top ? parseInt(document.body.style.top) * -1 : 0
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      if (scrollY) {
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen, onClose])

  const sizeClasses = {
    sm: 'max-w-[95vw] md:max-w-md',
    md: 'max-w-[95vw] md:max-w-lg',
    lg: 'max-w-[95vw] md:max-w-2xl',
    xl: 'max-w-[95vw] md:max-w-4xl',
    large: 'max-w-[95vw] md:max-w-4xl',
  }

  if (!isMounted) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Modal */}
      <div
        ref={contentRef}
        className={cn(
          'relative bg-bg-secondary border border-bg-tertiary rounded-2xl shadow-2xl w-full transition-all duration-300',
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-5',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-bg-tertiary">
            {title && (
              <h2 className="text-lg md:text-xl font-bold text-text-primary pr-4">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors touch-manipulation flex-shrink-0"
                aria-label="Close"
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
        <div className="p-4 md:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 md:pt-6 border-t border-bg-tertiary">
      {children}
    </div>
  )
}
