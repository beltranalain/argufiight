'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface SharePrivateDebateProps {
  debateId: string
  shareToken: string | null
  isPrivate: boolean
}

export function SharePrivateDebate({ debateId, shareToken, isPrivate }: SharePrivateDebateProps) {
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setShareUrl(`${window.location.origin}/debate/${debateId}?shareToken=${shareToken}`)
  }, [debateId, shareToken])

  if (!isPrivate || !shareToken) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      showToast({
        title: 'Link Copied!',
        description: 'Share this link to give others access to this private debate',
        type: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      showToast({
        title: 'Copy Failed',
        description: 'Failed to copy link. Please try again.',
        type: 'error',
      })
    }
  }

  return (
    <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">Private Debate</h3>
          <p className="text-xs text-text-secondary">Share this link to give others access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-text-primary text-sm focus:outline-none focus:border-electric-blue"
        />
        <Button
          variant="primary"
          onClick={handleCopy}
          className="px-4 py-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

