'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

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

export default function BlogManagementPage() {
  const { showToast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

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

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Blog Management</h1>
          <p className="text-text-secondary">Create, edit, and manage blog posts</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              window.open('/blog', '_blank')
            }}
          >
            View Public Blog
          </Button>
          <Button
            onClick={() => {
              setSelectedPost(null)
              setIsCreateModalOpen(true)
            }}
          >
            New Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="ALL">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-bg-secondary rounded-xl border border-bg-tertiary">
            <p className="text-text-secondary text-lg mb-4">No blog posts found</p>
            <Button
              onClick={() => {
                setSelectedPost(null)
                setIsCreateModalOpen(true)
              }}
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-electric-blue/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    {post.featured && (
                      <span className="px-2 py-1 text-xs rounded bg-neon-orange/20 text-neon-orange">
                        Featured
                      </span>
                    )}
                  </div>
                  {post.excerpt && (
                    <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>By {post.author.username}</span>
                    <span>•</span>
                    <span>{post.views} views</span>
                    <span>•</span>
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString()
                        : 'Not published'}
                    </span>
                    {post.categories.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {post.categories.map((c) => c.name).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {post.status === 'PUBLISHED' && (
                    <Link
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      className="px-3 py-1.5 text-sm text-electric-blue hover:text-[#00B8E6] transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedPost(post)
                      setIsEditModalOpen(true)
                    }}
                    className="text-sm px-3 py-1.5"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(post.id)}
                    className="text-sm px-3 py-1.5 text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <BlogPostEditor
          post={selectedPost ? {
            ...selectedPost,
            categoryIds: selectedPost.categories.map(c => c.id),
            tagIds: selectedPost.tags.map(t => t.id),
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

import { BlogPostEditor } from '@/components/admin/BlogPostEditor'

