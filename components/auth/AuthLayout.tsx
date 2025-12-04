'use client'

import React from 'react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-5">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-electric-blue rounded-full opacity-15 blur-[80px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neon-orange rounded-full opacity-15 blur-[80px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-hot-pink rounded-full opacity-15 blur-[80px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[440px]">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-3">
            <h1 className="text-[32px] font-bold bg-gradient-to-r from-electric-blue to-neon-orange bg-clip-text text-transparent">
              ARGU FIGHT
            </h1>
          </Link>
          <p className="text-text-secondary text-sm">
            Where debates are judged by AI
          </p>
        </div>

        {/* Card */}
        {children}
      </div>
    </div>
  )
}

