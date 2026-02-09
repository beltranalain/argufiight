'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { BlogPostEditor } from '@/components/admin/BlogPostEditor'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string | null
  ogImage: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
  publishedAt: string | null
  featuredImageId: string | null
  featuredImage: {
    id: string
    url: string
    alt: string | null
  } | null
  categoryIds: string[]
  tagIds: string[]
  views: number
  featured: boolean
  author: {
    id: string
    username: string
    email: string
  }
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  createdAt: string
  updatedAt: string
}

export default function BlogManagementTab() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoadingPost, setIsLoadingPost] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [editParamHandled, setEditParamHandled] = useState(false)

  // Auto-open editor when ?edit=<postId> is in the URL
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && !editParamHandled && !isEditModalOpen) {
      setEditParamHandled(true)
      setIsLoadingPost(true)
      fetch(`/api/admin/blog/${editId}`)
        .then(res => {
          if (res.ok) return res.json()
          throw new Error('Post not found')
        })
        .then(data => {
          setSelectedPost({
            ...data.post,
            categoryIds: data.post.categories?.map((c: any) => c.id) || [],
            tagIds: data.post.tags?.map((t: any) => t.id) || [],
          })
          setIsEditModalOpen(true)
        })
        .catch(error => {
          console.error('Failed to load post from edit param:', error)
          showToast({
            type: 'error',
            title: 'Post Not Found',
            description: 'Could not find the blog post to edit',
          })
        })
        .finally(() => setIsLoadingPost(false))
    }
  }, [searchParams, editParamHandled, isEditModalOpen])

  useEffect(() => {
    fetchPosts()
  }, [statusFilter, searchQuery])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/admin/blog?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Load',
          description: 'Failed to fetch blog posts',
        })
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch blog posts',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Deleted',
          description: 'Blog post deleted successfully',
        })
        fetchPosts()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete blog post',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'DRAFT':
        return 'bg-text-muted/20 text-text-muted'
      case 'SCHEDULED':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'ARCHIVED':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-bg-tertiary text-text-secondary'
    }
  }

  const filteredPosts = posts.filter(post => {
    if (statusFilter !== 'ALL' && post.status !== statusFilter) return false
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Blog Posts</h2>
          <p className="text-text-secondary mt-1">Manage your blog posts and content</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          + Create Post
        </Button>
      </div>

      <Card>
        <CardBody>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <p className="text-text-secondary text-center py-8">
              {searchQuery || statusFilter !== 'ALL' ? 'No posts match your filters' : 'No blog posts yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg hover:border-electric-blue/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                        <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                        {post.featured && (
                          <Badge className="bg-neon-orange/20 text-neon-orange">Featured</Badge>
                        )}
                      </div>
                      {post.excerpt && (
                        <p className="text-sm text-text-secondary mb-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-text-muted">
                        <span>Views: {post.views}</span>
                        <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.publishedAt && (
                          <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="secondary" size="sm">View</Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          setIsLoadingPost(true)
                          try {
                            const response = await fetch(`/api/admin/blog/${post.id}`)
                            if (response.ok) {
                              const data = await response.json()
                              setSelectedPost({
                                ...data.post,
                                categoryIds: data.post.categories.map((c: any) => c.id),
                                tagIds: data.post.tags.map((t: any) => t.id),
                              })
                              setIsEditModalOpen(true)
                            }
                          } catch (error) {
                            console.error('Failed to fetch post:', error)
                            showToast({
                              type: 'error',
                              title: 'Error',
                              description: 'Failed to load post for editing',
                            })
                          } finally {
                            setIsLoadingPost(false)
                          }
                        }}
                        disabled={isLoadingPost}
                      >
                        {isLoadingPost ? 'Loading...' : 'Edit'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <BlogPostEditor
          post={selectedPost ? {
            ...selectedPost,
            categoryIds: selectedPost.categories?.map(c => c.id) || [],
            tagIds: selectedPost.tags?.map(t => t.id) || [],
          } : null}
          onClose={() => {
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
            setSelectedPost(null)
          }}
          onSave={() => {
            fetchPosts()
            setIsCreateModalOpen(false)
            setIsEditModalOpen(false)
            setSelectedPost(null)
          }}
        />
      )}
    </div>
  )
}

