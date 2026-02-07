'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface AIUser {
  id?: string
  username: string
  avatarUrl: string | null
  aiPersonality: string
  aiResponseDelay: number
  aiPaused: boolean
}

interface AIUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingUser?: AIUser | null
}

const PERSONALITIES = [
  { value: 'BALANCED', label: 'Balanced', description: 'Well-rounded arguments, considers both sides' },
  { value: 'SMART', label: 'Smart', description: 'Analytical, uses facts and logic' },
  { value: 'AGGRESSIVE', label: 'Aggressive', description: 'Strong, assertive, confrontational' },
  { value: 'CALM', label: 'Calm', description: 'Composed, measured responses' },
  { value: 'WITTY', label: 'Witty', description: 'Humorous, clever, uses wordplay' },
  { value: 'ANALYTICAL', label: 'Analytical', description: 'Data-driven, detailed analysis' },
]

const DELAY_OPTIONS = [
  { value: 180000, label: '3 minutes' }, // 3 min
  { value: 300000, label: '5 minutes' }, // 5 min
  { value: 420000, label: '7 minutes' }, // 7 min
  { value: 600000, label: '10 minutes' }, // 10 min
  { value: 1800000, label: '30 minutes' }, // 30 min
  { value: 3600000, label: '1 hour' }, // 1 hour
  { value: 7200000, label: '2 hours' }, // 2 hours
  { value: 14400000, label: '4 hours' }, // 4 hours
  { value: 28800000, label: '8 hours' }, // 8 hours
  { value: 86400000, label: '1 day' }, // 1 day
  { value: 172800000, label: '2 days' }, // 2 days
]

export function AIUserModal({ isOpen, onClose, onSuccess, editingUser }: AIUserModalProps) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<AIUser>({
    username: '',
    avatarUrl: null,
    aiPersonality: 'BALANCED',
    aiResponseDelay: 3600000, // 1 hour default
    aiPaused: false,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username,
        avatarUrl: editingUser.avatarUrl,
        aiPersonality: editingUser.aiPersonality,
        aiResponseDelay: editingUser.aiResponseDelay,
        aiPaused: editingUser.aiPaused,
      })
      setSelectedFile(null)
    } else {
      setFormData({
        username: '',
        avatarUrl: null,
        aiPersonality: 'BALANCED',
        aiResponseDelay: 3600000,
        aiPaused: false,
      })
      setSelectedFile(null)
    }
  }, [editingUser, isOpen])

  const handleSave = async () => {
    if (!formData.username.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Username is required',
      })
      return
    }

    setIsSaving(true)
    try {
      const submitFormData = new FormData()
      submitFormData.append('username', formData.username.trim())
      submitFormData.append('aiPersonality', formData.aiPersonality)
      submitFormData.append('aiResponseDelay', formData.aiResponseDelay.toString())
      submitFormData.append('aiPaused', formData.aiPaused.toString())
      if (formData.avatarUrl && !selectedFile) {
        submitFormData.append('avatarUrl', formData.avatarUrl)
      }
      if (selectedFile) {
        submitFormData.append('file', selectedFile)
      }

      const url = editingUser?.id
        ? `/api/admin/ai-users/${editingUser.id}`
        : '/api/admin/ai-users'
      const method = editingUser?.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: submitFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save AI user')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `AI user ${editingUser?.id ? 'updated' : 'created'} successfully!`,
      })

      onSuccess()
      onClose()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save AI user',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser?.id ? 'Edit AI User' : 'Create AI User'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Username *
          </label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="AI User Name"
            disabled={!!editingUser?.id} // Can't change username after creation
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Profile Image
          </label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              setSelectedFile(file || null)
            }}
            className="w-full"
          />
          {!selectedFile && formData.avatarUrl && (
            <div className="mt-2">
              <img
                src={formData.avatarUrl}
                alt="Current avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Personality *
          </label>
          <select
            value={formData.aiPersonality}
            onChange={(e) => setFormData({ ...formData, aiPersonality: e.target.value })}
            className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
          >
            {PERSONALITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} - {p.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Auto-Accept Delay *
          </label>
          <select
            value={formData.aiResponseDelay}
            onChange={(e) => setFormData({ ...formData, aiResponseDelay: parseInt(e.target.value) })}
            className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
          >
            {DELAY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-1">
            How long to wait before auto-accepting open challenges
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="aiPaused"
            checked={formData.aiPaused}
            onChange={(e) => setFormData({ ...formData, aiPaused: e.target.checked })}
            className="w-5 h-5 rounded border-2 border-bg-tertiary bg-bg-secondary checked:bg-gradient-to-r checked:from-electric-blue checked:to-neon-orange checked:border-electric-blue cursor-pointer"
          />
          <label htmlFor="aiPaused" className="text-sm text-text-secondary cursor-pointer">
            Paused (AI user will not accept challenges or respond)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            {editingUser?.id ? 'Update' : 'Create'} AI User
          </Button>
        </div>
      </div>
    </Modal>
  )
}

