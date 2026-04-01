'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { MessageSquare, CornerDownRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface DebateCommentsProps {
  debateId: string;
  currentUserId: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DebateComments({ debateId, currentUserId }: DebateCommentsProps) {
  const { success, error: toastError } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/debates/${debateId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [debateId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/debates/${debateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        toastError('Failed to post comment', d.error);
        return;
      }
      setContent('');
      success('Comment posted');
      fetchComments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!replyContent.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/debates/${debateId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (!res.ok) {
        const d = await res.json();
        toastError('Failed to reply', d.error);
        return;
      }
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } finally {
      setSubmittingReply(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(`/api/debates/${debateId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchComments();
    } catch {}
  }

  if (loading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-text-3">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-text-3" />
        <p className="text-[14px] font-[500] text-text">
          Comments ({comments.reduce((acc: number, c: any) => acc + 1 + (c.replies?.length ?? 0), 0)})
        </p>
      </div>

      {/* Post comment form */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Share your thoughts on this debate..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full min-h-[60px] max-h-[160px] resize-y"
          />
          <div className="flex justify-end">
            <Button
              variant="accent"
              size="sm"
              type="submit"
              loading={submitting}
              disabled={!content.trim()}
            >
              Comment
            </Button>
          </div>
        </form>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-[13px] text-text-3 text-center py-4">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment: any) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <div className="flex gap-2.5">
                <Avatar src={comment.user?.avatarUrl} fallback={comment.user?.username ?? '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-[500] text-text">{comment.user?.username}</p>
                    <p className="text-[11px] text-text-3" suppressHydrationWarning>{timeAgo(comment.createdAt)}</p>
                  </div>
                  <p className="text-[14px] text-text-2 mt-0.5 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {currentUserId && (
                      <button
                        onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyContent(''); }}
                        className="text-[12px] text-text-3 hover:text-text transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CornerDownRight size={10} />
                        Reply
                      </button>
                    )}
                    {currentUserId === comment.userId && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[12px] text-text-3 hover:text-[var(--red)] transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-2 flex gap-2">
                      <Textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={1}
                        className="flex-1 min-h-[36px] max-h-[100px] resize-y text-[13px]"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.metaKey) handleReply(comment.id);
                        }}
                      />
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        loading={submittingReply}
                        disabled={!replyContent.trim()}
                      >
                        Reply
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className="mt-2.5 space-y-2.5 pl-3 border-l border-border">
                      {comment.replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                          <Avatar src={reply.user?.avatarUrl} fallback={reply.user?.username ?? '?'} size="xs" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px] font-[500] text-text">{reply.user?.username}</p>
                              <p className="text-[11px] text-text-3" suppressHydrationWarning>{timeAgo(reply.createdAt)}</p>
                            </div>
                            <p className="text-[13px] text-text-2 mt-0.5 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                            {currentUserId === reply.userId && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                className="text-[11px] text-text-3 hover:text-[var(--red)] transition-colors cursor-pointer flex items-center gap-1 mt-1"
                              >
                                <Trash2 size={9} />
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
          ))}
        </div>
      )}
    </div>
  );
}
