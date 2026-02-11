'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    avatarUrl: string | null
  }
  replies?: Comment[]
}

interface CommentsSectionProps {
  debateId: string
}

export function CommentsSection({ debateId }: CommentsSectionProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(false)

  // Check if comments are enabled
  useEffect(() => {
    const checkFeatures = async () => {
      try {
        const response = await fetch('/api/features')
        if (response.ok) {
          const flags = await response.json()
          setCommentsEnabled(flags.FEATURE_COMMENTS_ENABLED !== false)
        }
      } catch (error) {
        console.error('Failed to fetch feature flags:', error)
      }
    }
    checkFeatures()
  }, [])

  useEffect(() => {
    if (!commentsEnabled) return

    fetchComments()

    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000)
    return () => clearInterval(interval)
  }, [debateId, commentsEnabled])

  useEffect(() => {
    // Only scroll to bottom when the user just posted a comment, not on poll updates
    if (shouldScrollRef.current) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      shouldScrollRef.current = false
    }
  }, [comments])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/debates/${debateId}/comments`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch {
      // Silently handle — polling will retry
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      showToast({
        type: 'error',
        title: 'Login Required',
        description: 'Please log in to comment',
      })
      return
    }

    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to post comment')
      }

      const comment = await response.json()
      shouldScrollRef.current = true
      setComments((prev) => [comment, ...prev])
      setNewComment('')
      
      showToast({
        type: 'success',
        title: 'Comment Posted',
        description: 'Your comment has been added',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to post comment',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post reply')
      }

      const reply = await response.json()

      // Update comments to add reply to parent
      shouldScrollRef.current = true
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? { ...comment, replies: [...(comment.replies || []), reply] }
            : comment
        )
      )
      
      setReplyContent('')
      setReplyingTo(null)
      
      showToast({
        type: 'success',
        title: 'Reply Posted',
        description: 'Your reply has been added',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to post reply',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(
        `/api/debates/${debateId}/comments/${commentId}`,
        { method: 'DELETE', credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      // Remove comment from state
      setComments((prev) =>
        prev.filter((comment) => comment.id !== commentId)
      )

      showToast({
        type: 'success',
        title: 'Comment Deleted',
        description: 'Your comment has been removed',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete comment',
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (!commentsEnabled) {
    return (
      <div className="flex items-center justify-center py-8 text-text-secondary">
        <p className="text-sm">Comments are currently disabled</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-3">
                <Avatar
                  src={comment.user.avatarUrl}
                  username={comment.user.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-text-primary text-sm">
                      {comment.user.username}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                      className="text-xs text-electric-blue hover:text-[#00B8E6] transition-colors"
                    >
                      {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                    {user && user.id === comment.user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-neon-orange hover:text-[#FF8C42] transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-electric-blue/30">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSubmitReply(comment.id)
                        }}
                        className="space-y-2"
                      >
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none text-sm"
                          rows={2}
                          maxLength={500}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent('')
                            }}
                            className="text-xs px-3 py-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            type="submit"
                            isLoading={isSubmitting}
                            disabled={!replyContent.trim()}
                            className="text-xs px-3 py-1"
                          >
                            Reply
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-bg-tertiary">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar
                            src={reply.user.avatarUrl}
                            username={reply.user.username}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-text-primary text-sm">
                                {reply.user.username}
                              </span>
                              <span className="text-xs text-text-muted">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                              {reply.content}
                            </p>
                            {user && user.id === reply.user.id && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-xs text-neon-orange hover:text-[#FF8C42] transition-colors mt-1"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment form */}
      {user ? (
        <form
          onSubmit={handleSubmitComment}
          className="border-t border-bg-tertiary p-4 space-y-2"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
            rows={3}
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {newComment.length}/1000
            </span>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="border-t border-bg-tertiary p-4 text-center text-text-secondary text-sm">
          <p>Please log in to comment</p>
        </div>
      )}
    </div>
  )
}

