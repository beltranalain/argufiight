'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
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

interface Admin {
  id: string
  username: string
  avatarUrl: string | null
}

export default function AdminSupportPage() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [filters, setFilters] = useState({
    status: 'all',
    assignedToId: 'all',
    priority: 'all',
  })

  // Reply form
  const [replyContent, setReplyContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [filters])

  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.assignedToId !== 'all') params.append('assignedToId', filters.assignedToId)
      if (filters.priority !== 'all') params.append('priority', filters.priority)

      const response = await fetch(`/api/admin/support/tickets?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
        setAdmins(data.admins || [])
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

  const handleUpdateTicket = async (updates: {
    status?: string
    assignedToId?: string | null
    priority?: string
  }) => {
    if (!selectedTicket) return

    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Ticket Updated',
          description: 'Ticket has been updated successfully',
        })
        handleViewTicket(selectedTicket.id)
        fetchTickets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update ticket')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update ticket',
      })
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
          isInternal,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Reply Sent',
          description: 'Your reply has been added to the ticket',
        })
        setReplyContent('')
        setIsInternal(false)
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

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Support Management</h1>
          <p className="text-text-secondary">Manage and respond to user support tickets</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="all">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Assigned To</label>
                <select
                  value={filters.assignedToId}
                  onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="all">All Assignments</option>
                  <option value="unassigned">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="all">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <p className="text-text-secondary">No support tickets found</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:bg-bg-secondary transition-colors"
                onClick={() => handleViewTicket(ticket.id)}
              >
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar
                          src={ticket.user.avatarUrl}
                          username={ticket.user.username}
                          size="sm"
                        />
                        <span className="font-semibold text-white">{ticket.user.username}</span>
                        <span className="text-text-secondary">•</span>
                        <span className="text-text-secondary text-sm">{ticket.user.email}</span>
                      </div>
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
                        {ticket.assignedTo ? (
                          <Badge variant="default" size="sm">
                            Assigned to {ticket.assignedTo.username}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm" className="bg-text-secondary">
                            Unassigned
                          </Badge>
                        )}
                        <span className="text-xs text-text-secondary">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => {
            setSelectedTicket(null)
            setReplyContent('')
            setIsInternal(false)
          }}
          title={selectedTicket.subject}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Ticket Info */}
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

            {/* User Info */}
            <div className="bg-bg-tertiary rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Avatar
                  src={selectedTicket.user.avatarUrl}
                  username={selectedTicket.user.username}
                  size="sm"
                />
                <div>
                  <p className="font-semibold text-white">{selectedTicket.user.username}</p>
                  <p className="text-xs text-text-secondary">{selectedTicket.user.email}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-white whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Created {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Admin Actions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Assign To</label>
                <select
                  value={selectedTicket.assignedTo?.id || ''}
                  onChange={(e) => handleUpdateTicket({ assignedToId: e.target.value || null })}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Replies */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Replies</h3>
              {selectedTicket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`bg-bg-tertiary rounded-lg p-4 ${
                    reply.author.isAdmin ? 'border-l-4 border-electric-blue' : ''
                  } ${reply.isInternal ? 'border-r-4 border-yellow-500' : ''}`}
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
                    {reply.isInternal && (
                      <Badge variant="default" size="sm" className="bg-yellow-500 text-black">
                        Internal
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
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="isInternal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isInternal" className="text-sm text-text-secondary">
                  Internal note (only visible to admins)
                </label>
              </div>
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

