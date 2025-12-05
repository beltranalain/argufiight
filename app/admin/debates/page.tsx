'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DebateDetailsModal } from '@/components/admin/DebateDetailsModal'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { useToast } from '@/components/ui/Toast'
import { cardHover, cardTap } from '@/lib/animations'

interface Debate {
  id: string
  topic: string
  description: string | null
  category: string
  status: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  createdAt: string
}

export default function AdminDebatesPage() {
  const [debates, setDebates] = useState<Debate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDebateId, setSelectedDebateId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchDebates()
  }, [])

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/debates?limit=50')
      if (response.ok) {
        const data = await response.json()
        setDebates(data)
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDebateClick = (debateId: string) => {
    setSelectedDebateId(debateId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDebateId(null)
  }

  const handleDeleteClick = (e: React.MouseEvent, debateId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteConfirmId(debateId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/debates/${deleteConfirmId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete debate')
      }

      // Remove from list
      setDebates(debates.filter(d => d.id !== deleteConfirmId))
      setDeleteConfirmId(null)

      showToast({
        type: 'success',
        title: 'Debate Deleted',
        description: 'The debate has been permanently deleted.',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete debate',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null)
  }

  return (
    <>
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Debate Management</h1>
        <p className="text-text-secondary mb-8">View and manage all platform debates</p>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">All Debates</h2>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : debates.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                }
                title="No Debates"
                description="No debates have been created yet"
              />
            ) : (
              <StaggerContainer className="space-y-4">
                {debates.map((debate) => (
                  <StaggerItem key={debate.id}>
                    <motion.div
                      onClick={() => handleDebateClick(debate.id)}
                      whileHover={cardHover}
                      whileTap={cardTap}
                      className="w-full text-left p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue hover:bg-bg-secondary transition-all cursor-pointer"
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={debate.category.toLowerCase() as any} size="sm">
                            {debate.category}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {debate.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <h3 className="text-white font-semibold mb-2">{debate.topic}</h3>
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <div className="flex items-center gap-2">
                            <Avatar 
                              username={debate.challenger.username}
                              src={debate.challenger.avatarUrl}
                              size="sm"
                            />
                            <span>{debate.challenger.username}</span>
                          </div>
                          <span>VS</span>
                          {debate.opponent ? (
                            <div className="flex items-center gap-2">
                              <Avatar 
                                username={debate.opponent.username}
                                src={debate.opponent.avatarUrl}
                                size="sm"
                              />
                              <span>{debate.opponent.username}</span>
                            </div>
                          ) : (
                            <span className="text-text-muted">Waiting...</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                        <div className="text-sm text-text-secondary">
                          {new Date(debate.createdAt).toLocaleDateString()}
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={(e) => handleDeleteClick(e, debate.id)}
                          className="text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardBody>
        </Card>
      </div>

      <DebateDetailsModal
        debateId={selectedDebateId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={handleDeleteCancel}
        title="Delete Debate"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this debate? This action cannot be undone.
          </p>
          {deleteConfirmId && (
            <p className="text-sm text-text-muted">
              Debate: <span className="font-semibold text-white">
                {debates.find(d => d.id === deleteConfirmId)?.topic}
              </span>
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

