'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
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

export default function SocialPostsPage() {
  const { showToast } = useToast()
  const [posts, setPosts] = useState<SocialMediaPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [postTopic, setPostTopic] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<'INSTAGRAM' | 'LINKEDIN' | 'TWITTER'>('INSTAGRAM')
  const [generatedContent, setGeneratedContent] = useState('')
  const [generatedImagePrompt, setGeneratedImagePrompt] = useState('')
  const [generatedHashtags, setGeneratedHashtags] = useState('')
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

  const handleGenerate = async () => {
    if (!postTopic.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a topic or theme for the post',
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/admin/social-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic.trim(),
          platform: selectedPlatform,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate post')
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      setGeneratedImagePrompt(data.imagePrompt)
      setGeneratedHashtags(data.hashtags)

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Post generated successfully!',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to generate post',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!generatedContent) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please generate content first',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: postTopic || 'General Platform Post',
          platform: selectedPlatform,
          content: generatedContent,
          imagePrompt: generatedImagePrompt,
          hashtags: generatedHashtags,
          status: 'DRAFT',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save post')
      }

      const responseData = await response.json()
      
      showToast({
        type: 'success',
        title: 'Success',
        description: 'Post saved successfully!',
      })
      setGeneratedContent('')
      setGeneratedImagePrompt('')
      setGeneratedHashtags('')
      setPostTopic('')
      fetchPosts()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save post',
      })
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

  const handlePostToSocial = (platform: string, content: string, hashtags?: string | null) => {
    const fullContent = hashtags ? `${content}\n\n${hashtags}` : content
    const encodedContent = encodeURIComponent(fullContent)
    
    let url = ''
    switch (platform) {
      case 'TWITTER':
      case 'X':
        url = `https://twitter.com/intent/tweet?text=${encodedContent}`
        break
      case 'LINKEDIN':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodedContent}`
        break
      case 'INSTAGRAM':
        // Instagram doesn't support URL parameters, so we'll copy to clipboard and open Instagram
        navigator.clipboard.writeText(fullContent)
        showToast({
          type: 'success',
          title: 'Content Copied!',
          description: 'Content copied to clipboard. Open Instagram and paste it manually.',
        })
        window.open('https://www.instagram.com/', '_blank')
        return
      default:
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Unsupported platform',
        })
        return
    }
    
    window.open(url, '_blank')
    showToast({
      type: 'success',
      title: 'Opening Platform',
      description: `Opening ${platform} with pre-filled content`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-primary">Social Media Post Manager</h1>
          </div>

          {/* Generator */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Generate New Post</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Post Topic / Theme
                    </label>
                    <Input
                      placeholder="e.g., Platform launch, New features, Community highlights..."
                      value={postTopic}
                      onChange={(e) => setPostTopic(e.target.value)}
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Enter a topic or theme for your social media post. Leave blank for general platform content.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Platform
                    </label>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value as any)}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                    >
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="TWITTER">Twitter/X</option>
                    </select>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  disabled={!postTopic.trim()}
                >
                  Generate Post
                </Button>
              </div>

              {generatedContent && (
                <div className="mt-6 space-y-4 p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text-secondary">Generated Content</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(generatedContent, 'Content')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-secondary rounded-lg text-text-primary min-h-[150px]"
                      placeholder="Generated content will appear here..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text-secondary">Sora Image Prompt</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(generatedImagePrompt, 'Image Prompt')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={generatedImagePrompt}
                      onChange={(e) => setGeneratedImagePrompt(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-tertiary border border-bg-secondary rounded-lg text-text-primary min-h-[100px]"
                      placeholder="Image prompt will appear here..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-text-secondary">Hashtags</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(generatedHashtags, 'Hashtags')}
                      >
                        Copy
                      </Button>
                    </div>
                    <Input
                      value={generatedHashtags}
                      onChange={(e) => setGeneratedHashtags(e.target.value)}
                      placeholder="Hashtags will appear here..."
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="secondary" onClick={handleSave}>
                      Save to Library
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => handlePostToSocial(selectedPlatform, generatedContent, generatedHashtags)}
                    >
                      Post to {selectedPlatform === 'TWITTER' ? 'Twitter/X' : selectedPlatform}
                    </Button>
                    <p className="text-xs text-text-muted">
                      💡 Tip: "Post to..." opens the platform with pre-filled content. For Instagram, content will be copied to clipboard.
                    </p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Posts List */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Saved Posts</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <Input
                  placeholder="Search posts..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {posts.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">No posts yet</p>
                ) : (
                  posts
                    .filter(post =>
                      post.content.toLowerCase().includes(postSearch.toLowerCase()) ||
                      (post.debate?.topic && post.debate.topic.toLowerCase().includes(postSearch.toLowerCase())) ||
                      post.platform.toLowerCase().includes(postSearch.toLowerCase())
                    )
                    .map((post) => (
                      <div
                        key={post.id}
                        className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
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
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCopy(post.content, 'Post Content')}
                            >
                              Copy
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handlePostToSocial(post.platform, post.content, post.hashtags)}
                            >
                              Post to {post.platform === 'TWITTER' ? 'Twitter/X' : post.platform}
                            </Button>
                          </div>
                        </div>
                        <p className="text-text-primary mb-2 whitespace-pre-wrap">{post.content}</p>
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
                    ))
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

