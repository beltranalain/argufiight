'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  replies: Array<{
    id: string
    content: string
    isInternal: boolean
    createdAt: string
    author: {
      id: string
      username: string
      avatarUrl: string | null
      isAdmin: boolean
    }
  }>
  assignedTo: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
}

export default function SupportPage() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // New ticket form
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reply form
  const [replyContent, setReplyContent] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [filter])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/support/tickets'
        : `/api/support/tickets?status=${filter}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load support tickets',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Subject and description are required',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          category: category || null,
          priority,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Ticket Created',
          description: 'Your support ticket has been created successfully',
        })
        setIsModalOpen(false)
        setSubject('')
        setDescription('')
        setCategory('')
        setPriority('MEDIUM')
        fetchTickets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to create support ticket',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTicket(data.ticket)
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
    }
  }

  const handleSubmitReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return

    setIsSubmittingReply(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Reply Sent',
          description: 'Your reply has been added to the ticket',
        })
        setReplyContent('')
        handleViewTicket(selectedTicket.id)
        fetchTickets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send reply')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to send reply',
      })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-electric-blue'
      case 'IN_PROGRESS':
        return 'bg-yellow-500'
      case 'RESOLVED':
        return 'bg-cyber-green'
      case 'CLOSED':
        return 'bg-text-secondary'
      default:
        return 'bg-bg-tertiary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500'
      case 'HIGH':
        return 'bg-neon-orange'
      case 'MEDIUM':
        return 'bg-yellow-500'
      case 'LOW':
        return 'bg-cyber-green'
      default:
        return 'bg-bg-tertiary'
    }
  }

  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filter)

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Support</h1>
            <p className="text-text-secondary">Get help from our support team</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            Create Ticket
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-electric-blue text-black'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-text-secondary mb-4">No support tickets found</p>
              <Button onClick={() => setIsModalOpen(true)}>
                Create Your First Ticket
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:bg-bg-secondary transition-colors"
                onClick={() => handleViewTicket(ticket.id)}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {ticket.subject}
                      </h3>
                      <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        {ticket.category && (
                          <Badge variant="default" size="sm">
                            {ticket.category}
                          </Badge>
                        )}
                        <span className="text-xs text-text-secondary">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.replies.length > 0 && (
                          <span className="text-xs text-text-secondary">
                            {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSubject('')
          setDescription('')
          setCategory('')
          setPriority('MEDIUM')
        }}
        title="Create Support Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Subject *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category (Optional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="">Select category</option>
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              isLoading={isSubmitting}
            >
              Create Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => {
            setSelectedTicket(null)
            setReplyContent('')
          }}
          title={selectedTicket.subject}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(selectedTicket.status)}>
                {selectedTicket.status.replace('_', ' ')}
              </Badge>
              <Badge className={getPriorityColor(selectedTicket.priority)}>
                {selectedTicket.priority}
              </Badge>
              {selectedTicket.category && (
                <Badge variant="default" size="sm">
                  {selectedTicket.category}
                </Badge>
              )}
            </div>

            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-white whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Created {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Replies */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Replies</h3>
              {selectedTicket.replies
                .filter(reply => !reply.isInternal)
                .map((reply) => (
                  <div
                    key={reply.id}
                    className={`bg-bg-tertiary rounded-lg p-4 ${
                      reply.author.isAdmin ? 'border-l-4 border-electric-blue' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar
                        src={reply.author.avatarUrl}
                        username={reply.author.username}
                        size="sm"
                      />
                      <span className="font-semibold text-white">
                        {reply.author.username}
                      </span>
                      {reply.author.isAdmin && (
                        <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                          Admin
                        </Badge>
                      )}
                      <span className="text-xs text-text-secondary ml-auto">
                        {new Date(reply.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-text-secondary whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                ))}
            </div>

            {/* Reply Form */}
            <div className="border-t border-bg-tertiary pt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Add Reply
              </label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent mb-2"
              />
              <Button
                onClick={handleSubmitReply}
                isLoading={isSubmittingReply}
                disabled={!replyContent.trim()}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

