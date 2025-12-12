'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'

export function ContentGenerators() {
  const { showToast } = useToast()
  const [activeGenerator, setActiveGenerator] = useState<'social' | 'blog' | 'newsletter'>('social')
  const [isGenerating, setIsGenerating] = useState(false)

  // Social Post
  const [socialTopic, setSocialTopic] = useState('')
  const [socialPlatform, setSocialPlatform] = useState<'INSTAGRAM' | 'LINKEDIN' | 'TWITTER'>('INSTAGRAM')
  const [socialContent, setSocialContent] = useState('')
  const [socialImagePrompt, setSocialImagePrompt] = useState('')
  const [socialHashtags, setSocialHashtags] = useState('')

  // Blog Post
  const [blogTopic, setBlogTopic] = useState('')
  const [blogTitle, setBlogTitle] = useState('')
  const [blogExcerpt, setBlogExcerpt] = useState('')
  const [blogContent, setBlogContent] = useState('')
  const [blogKeywords, setBlogKeywords] = useState('')

  // Newsletter
  const [newsletterTopic, setNewsletterTopic] = useState('')
  const [newsletterSubject, setNewsletterSubject] = useState('')
  const [newsletterContent, setNewsletterContent] = useState('')

  const handleGenerateSocial = async () => {
    if (!socialTopic.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a topic',
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/admin/social-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: socialTopic.trim(),
          platform: socialPlatform,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate post')
      }

      const data = await response.json()
      setSocialContent(data.content)
      setSocialImagePrompt(data.imagePrompt)
      setSocialHashtags(data.hashtags)

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

  const handleGenerateBlog = async () => {
    if (!blogTopic.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a topic',
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/admin/marketing/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: blogTopic.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate blog post')
      }

      const data = await response.json()
      setBlogTitle(data.blogPost.title)
      setBlogExcerpt(data.blogPost.excerpt || '')
      setBlogContent(data.blogPost.content)
      setBlogKeywords(data.blogPost.keywords || '')

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Blog post generated successfully!',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to generate blog post',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateNewsletter = async () => {
    if (!newsletterTopic.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a topic',
      })
      return
    }

    try {
      setIsGenerating(true)
      const response = await fetch('/api/admin/marketing/newsletter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: newsletterTopic.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate newsletter')
      }

      const data = await response.json()
      setNewsletterSubject(data.newsletter.subject)
      setNewsletterContent(data.newsletter.content)

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Newsletter generated successfully!',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to generate newsletter',
      })
    } finally {
      setIsGenerating(false)
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

  return (
    <div className="space-y-6">
      {/* Generator Tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary">
        {[
          { id: 'social', label: 'Social Media', icon: '📱' },
          { id: 'blog', label: 'Blog Post', icon: '📝' },
          { id: 'newsletter', label: 'Newsletter', icon: '📧' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveGenerator(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeGenerator === tab.id
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Social Media Generator */}
      {activeGenerator === 'social' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Generate Social Media Post</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Topic / Theme
                  </label>
                  <Input
                    value={socialTopic}
                    onChange={(e) => setSocialTopic(e.target.value)}
                    placeholder="e.g., Platform features, Debate highlights..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Platform
                  </label>
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value as any)}
                    className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="TWITTER">Twitter/X</option>
                  </select>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleGenerateSocial}
                isLoading={isGenerating}
                disabled={!socialTopic.trim()}
              >
                Generate Post
              </Button>

              {socialContent && (
                <div className="mt-6 space-y-4 p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Content</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(socialContent, 'Content')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={socialContent}
                      onChange={(e) => setSocialContent(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white min-h-[150px]"
                    />
                  </div>
                  {socialImagePrompt && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white">Image Prompt</label>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(socialImagePrompt, 'Image Prompt')}
                        >
                          Copy
                        </Button>
                      </div>
                      <textarea
                        value={socialImagePrompt}
                        onChange={(e) => setSocialImagePrompt(e.target.value)}
                        className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white min-h-[100px]"
                      />
                    </div>
                  )}
                  {socialHashtags && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white">Hashtags</label>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopy(socialHashtags, 'Hashtags')}
                        >
                          Copy
                        </Button>
                      </div>
                      <Input value={socialHashtags} onChange={(e) => setSocialHashtags(e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Blog Post Generator */}
      {activeGenerator === 'blog' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Generate Blog Post</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Topic
                </label>
                <Input
                  value={blogTopic}
                  onChange={(e) => setBlogTopic(e.target.value)}
                  placeholder="e.g., How to win debates, AI judges explained..."
                />
              </div>
              <Button
                variant="primary"
                onClick={handleGenerateBlog}
                isLoading={isGenerating}
                disabled={!blogTopic.trim()}
              >
                Generate Blog Post
              </Button>

              {blogContent && (
                <div className="mt-6 space-y-4 p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Title</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(blogTitle, 'Title')}
                      >
                        Copy
                      </Button>
                    </div>
                    <Input
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Excerpt</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(blogExcerpt, 'Excerpt')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white min-h-[80px]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Content</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(blogContent, 'Content')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white min-h-[300px]"
                    />
                  </div>
                  {blogKeywords && (
                    <div>
                      <label className="text-sm font-medium text-white mb-2">SEO Keywords</label>
                      <Input
                        value={blogKeywords}
                        onChange={(e) => setBlogKeywords(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Newsletter Generator */}
      {activeGenerator === 'newsletter' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Generate Email Newsletter</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Topic / Theme
                </label>
                <Input
                  value={newsletterTopic}
                  onChange={(e) => setNewsletterTopic(e.target.value)}
                  placeholder="e.g., Monthly update, New features, Community highlights..."
                />
              </div>
              <Button
                variant="primary"
                onClick={handleGenerateNewsletter}
                isLoading={isGenerating}
                disabled={!newsletterTopic.trim()}
              >
                Generate Newsletter
              </Button>

              {newsletterContent && (
                <div className="mt-6 space-y-4 p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Subject</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(newsletterSubject, 'Subject')}
                      >
                        Copy
                      </Button>
                    </div>
                    <Input
                      value={newsletterSubject}
                      onChange={(e) => setNewsletterSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Content</label>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopy(newsletterContent, 'Content')}
                      >
                        Copy
                      </Button>
                    </div>
                    <textarea
                      value={newsletterContent}
                      onChange={(e) => setNewsletterContent(e.target.value)}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white min-h-[300px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

