'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-9xl font-bold text-electric-blue mb-4">404</h1>
          <h2 className="text-4xl font-bold text-text-primary mb-4">Debate Not Found</h2>
          <p className="text-lg text-text-secondary mb-8">
            This debate may have been removed, the URL is incorrect, or the page doesn't exist.
          </p>
        </div>

        <div className="bg-bg-tertiary rounded-xl p-8 space-y-6">
          <h3 className="text-2xl font-semibold text-text-primary mb-4">Try These Instead:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/"
              className="block p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors border-2 border-transparent hover:border-electric-blue"
            >
              <div className="text-electric-blue font-semibold mb-1">🏠 Homepage</div>
              <div className="text-sm text-text-secondary">Return to the main page</div>
            </Link>
            
            <Link
              href="/debates"
              className="block p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors border-2 border-transparent hover:border-electric-blue"
            >
              <div className="text-electric-blue font-semibold mb-1">💬 Browse Debates</div>
              <div className="text-sm text-text-secondary">Explore public debates</div>
            </Link>
            
            <Link
              href="/tournaments"
              className="block p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors border-2 border-transparent hover:border-electric-blue"
            >
              <div className="text-electric-blue font-semibold mb-1">🏆 Tournaments</div>
              <div className="text-sm text-text-secondary">Join a competition</div>
            </Link>
            
            <Link
              href="/leaderboard"
              className="block p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors border-2 border-transparent hover:border-electric-blue"
            >
              <div className="text-electric-blue font-semibold mb-1">📊 Leaderboard</div>
              <div className="text-sm text-text-secondary">View top debaters</div>
            </Link>
          </div>
        </div>

        <div className="pt-4">
          <p className="text-text-secondary mb-4">Or search for debates:</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="search"
              placeholder="Search debates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-secondary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  window.location.href = `/debates?search=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  window.location.href = `/debates?search=${encodeURIComponent(searchQuery.trim())}`
                }
              }}
              className="px-6 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-electric-blue/90 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        <div className="pt-4">
          <Link
            href="/support"
            className="text-electric-blue hover:underline text-sm"
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
