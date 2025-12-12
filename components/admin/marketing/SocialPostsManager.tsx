'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface SocialMediaPost {
  id: string
  debateId: string | null
  platform: string
  content: string
  imagePrompt: string | null
  hashtags: string | null
  status: string
  scheduledAt: string | null
  createdAt: string
  debate: {
    id: string
    topic: string
    category: {
      name: string
    } | null
    challenger: {
      username: string
    }
    opponent: {
      username: string
    } | null
  } | null
}

export function SocialPostsManager() {
  const { showToast } = useToast()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [postSearch, setPostSearch] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/social-posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load social media posts',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    showToast({
      type: 'success',
      title: 'Copied!',
      description: `${type} copied to clipboard`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'APPROVED':
        return 'bg-electric-blue/20 text-electric-blue'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(postSearch.toLowerCase()) ||
    (post.debate?.topic && post.debate.topic.toLowerCase().includes(postSearch.toLowerCase())) ||
    post.platform.toLowerCase().includes(postSearch.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Saved Social Media Posts</h2>
            <p className="text-sm text-text-secondary mt-1">
              Manage and view all your saved social media posts
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-4">
          <Input
            placeholder="Search posts by content, topic, or platform..."
            value={postSearch}
            onChange={(e) => setPostSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <p className="text-text-secondary text-center py-8">
            {postSearch ? 'No posts match your search' : 'No posts yet. Generate your first post above!'}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg hover:border-electric-blue/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{post.platform}</Badge>
                      <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                    </div>
                    {post.debate ? (
                      <>
                        <p className="text-sm text-text-secondary">
                          Debate: {post.debate.topic}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {post.debate.challenger.username} vs {post.debate.opponent?.username || 'TBD'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-text-secondary">
                        General Platform Post
                      </p>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCopy(post.content, 'Post Content')}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-white mb-2 whitespace-pre-wrap">{post.content}</p>
                {post.hashtags && (
                  <p className="text-sm text-electric-blue mb-2">{post.hashtags}</p>
                )}
                {post.imagePrompt && (
                  <details className="mt-2">
                    <summary className="text-sm text-text-secondary cursor-pointer">
                      View Image Prompt
                    </summary>
                    <p className="text-sm text-text-muted mt-2">{post.imagePrompt}</p>
                  </details>
                )}
                <p className="text-xs text-text-muted mt-2">
                  Created: {new Date(post.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

