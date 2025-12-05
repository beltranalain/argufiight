'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface SocialMediaLink {
  id: string
  platform: string
  url: string
  order: number
  isActive: boolean
}

interface SocialMediaLinksManagerProps {
  links: SocialMediaLink[]
  onSave: (platform: string, url: string, order: number) => void
  onDelete: (platform: string) => void
}

export function SocialMediaLinksManager({
  links,
  onSave,
  onDelete,
}: SocialMediaLinksManagerProps) {
  const { showToast } = useToast()
  const [editingLink, setEditingLink] = useState<{ platform: string; url: string } | null>(null)

  const PLATFORMS = [
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'TWITTER', label: 'Twitter/X' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'LINKEDIN', label: 'LinkedIn' },
    { value: 'YOUTUBE', label: 'YouTube' },
    { value: 'TIKTOK', label: 'TikTok' },
  ]

  const getLinkForPlatform = (platform: string) => {
    return links.find(l => l.platform === platform)
  }

  const handleSave = (platform: string) => {
    const link = editingLink
    if (!link || !link.url.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a valid URL',
      })
      return
    }

    // Validate URL
    try {
      new URL(link.url)
    } catch {
      showToast({
        type: 'error',
        title: 'Invalid URL',
        description: 'Please enter a valid URL (e.g., https://...)',
      })
      return
    }

    const existingLink = getLinkForPlatform(platform)
    onSave(platform, link.url, existingLink?.order || links.length)
    setEditingLink(null)
  }

  return (
    <div className="space-y-4">
      {PLATFORMS.map((platform) => {
        const link = getLinkForPlatform(platform.value)
        const isEditing = editingLink?.platform === platform.value

        return (
          <div
            key={platform.value}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-white font-semibold">{platform.label}</h3>
                  {link && link.isActive && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-electric-blue text-sm hover:underline"
                    >
                      {link.url}
                    </a>
                  )}
                  {!link && (
                    <p className="text-text-secondary text-sm">No link added</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingLink.url}
                      onChange={(e) =>
                        setEditingLink({ platform: platform.value, url: e.target.value })
                      }
                      className="px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm w-64 focus:outline-none focus:border-electric-blue"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleSave(platform.value)}
                      className="text-xs px-3 py-1.5"
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingLink(null)}
                      className="text-xs px-3 py-1.5"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setEditingLink({
                          platform: platform.value,
                          url: link?.url || '',
                        })
                      }
                      className="text-xs px-3 py-1.5"
                    >
                      {link ? 'Edit' : 'Add Link'}
                    </Button>
                    {link && (
                      <Button
                        variant="secondary"
                        onClick={() => onDelete(platform.value)}
                        className="text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

