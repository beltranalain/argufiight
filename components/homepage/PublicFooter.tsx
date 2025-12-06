'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SocialMediaIcon } from '@/components/ui/SocialMediaIcon'

interface SocialMediaLink {
  platform: string
  url: string
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  TWITTER: 'X',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
}

export function PublicFooter() {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([])

  useEffect(() => {
    fetch('/api/content/social-media')
      .then((res) => res.json())
      .then((data) => setSocialLinks(data.links || []))
      .catch(() => setSocialLinks([]))
  }, [])

  return (
    <footer className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Footer Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Platform Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors text-base">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-white/80 hover:text-white transition-colors text-base">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="text-white/80 hover:text-white transition-colors text-base">
                  Advertiser
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-white/80 hover:text-white transition-colors text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/80 hover:text-white transition-colors text-base">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Connect</h3>
            <p className="text-white/80 text-base mb-4">support@argufight.com</p>
            
            {/* Social Media Links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                    title={PLATFORM_LABELS[link.platform] || link.platform}
                  >
                    <SocialMediaIcon platform={link.platform} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white/60 text-sm pt-8 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} Argu Fight. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

