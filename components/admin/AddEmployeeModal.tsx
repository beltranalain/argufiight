'use client'

import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const EMPLOYEE_ROLES = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Moderator', label: 'Moderator' },
  { value: 'Support', label: 'Support' },
  { value: 'Developer', label: 'Developer' },
]

const ACCESS_LEVELS = [
  { value: 'full', label: 'Full Access', description: 'Complete access to all admin features' },
  { value: 'moderation', label: 'Moderation', description: 'Can manage users, debates, and content moderation' },
  { value: 'support', label: 'Support', description: 'Can view data and assist users' },
  { value: 'readonly', label: 'Read Only', description: 'Can view data but cannot make changes' },
]

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Admin',
    accessLevel: 'full',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

      if (formData.password !== formData.confirmPassword) {
      showToast({ title: 'Passwords do not match', type: 'error' })
      return
    }

    if (formData.password.length < 8) {
      showToast({ title: 'Password must be at least 8 characters', type: 'error' })
      return
    }

    setIsLoading(true)

    try {
      console.log('[AddEmployeeModal] Creating employee with data:', { ...formData, password: '[REDACTED]', confirmPassword: '[REDACTED]' })
      
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          accessLevel: formData.accessLevel,
        }),
      })

      const data = await response.json()
      console.log('[AddEmployeeModal] Response:', { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.error || `Failed to create employee (${response.status})`
        console.error('[AddEmployeeModal] Error creating employee:', errorMessage)
        showToast({ 
          title: 'Error', 
          description: errorMessage,
          type: 'error' 
        })
        return
      }

      console.log('[AddEmployeeModal] Employee created successfully:', data.employee)
      showToast({ title: 'Employee created successfully', type: 'success' })
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Admin',
        accessLevel: 'full',
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('[AddEmployeeModal] Failed to create employee:', error)
      showToast({ 
        title: 'Error', 
        description: error.message || 'An unexpected error occurred',
        type: 'error' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Employee" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Username
          </label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            placeholder="Enter username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            placeholder="Enter email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            placeholder="Enter password (min 8 characters)"
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
            placeholder="Confirm password"
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
          >
            {EMPLOYEE_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Access Level
          </label>
          <select
            value={formData.accessLevel}
            onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent"
          >
            {ACCESS_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-text-secondary mt-1">
            {ACCESS_LEVELS.find(l => l.value === formData.accessLevel)?.description}
          </p>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Employee'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

