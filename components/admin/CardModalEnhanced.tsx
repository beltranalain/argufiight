'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'
import { useToast } from '@/components/ui/Toast'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor').then(m => ({ default: m.RichTextEditor })), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-bg-tertiary rounded-lg animate-pulse" />,
})
import { Avatar } from '@/components/ui/Avatar'

interface CardLabel {
  id: string
  name: string
  color: string
}

interface CardChecklist {
  id: string
  title: string
  items: CardChecklistItem[]
}

interface CardChecklistItem {
  id: string
  text: string
  isCompleted: boolean
}

interface CardMember {
  id: string
  userId: string
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
}

interface CardAttachment {
  id: string
  name: string
  url: string
  type: string
}

interface CardCustomField {
  id: string
  name: string
  value: string
  fieldType: string
}

interface Card {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  startDate?: string | null
  reminderDate?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  labels: CardLabel[]
  checklists?: CardChecklist[]
  members?: CardMember[]
  attachments?: CardAttachment[]
  customFields?: CardCustomField[]
}

interface CardModalEnhancedProps {
  card: Card | null
  title: string
  description: string
  dueDate: string
  startDate: string
  reminderDate: string
  location: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onReminderDateChange: (value: string) => void
  onLocationChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  onRefresh?: () => void
}

export function CardModalEnhanced({
  card,
  title,
  description,
  dueDate,
  startDate,
  reminderDate,
  location,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onStartDateChange,
  onReminderDateChange,
  onLocationChange,
  onSave,
  onClose,
  onRefresh,
}: CardModalEnhancedProps) {
  const { showToast } = useToast()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [labels, setLabels] = useState<CardLabel[]>(card?.labels || [])
  const [checklists, setChecklists] = useState<CardChecklist[]>(card?.checklists || [])
  const [members, setMembers] = useState<CardMember[]>(card?.members || [])
  const [attachments, setAttachments] = useState<CardAttachment[]>(card?.attachments || [])
  const [customFields, setCustomFields] = useState<CardCustomField[]>(card?.customFields || [])
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; username: string; email: string; avatarUrl: string | null }>>([])

  // Form states
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f')
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [newChecklistItemText, setNewChecklistItemText] = useState<Record<string, string>>({})
  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  const [newAttachmentType, setNewAttachmentType] = useState('link')
  const [newCustomFieldName, setNewCustomFieldName] = useState('')
  const [newCustomFieldValue, setNewCustomFieldValue] = useState('')
  const [newCustomFieldType, setNewCustomFieldType] = useState('text')

  const labelColors = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
    '#c377e0', '#0079bf', '#00c2e0', '#51e898',
    '#ff78cb', '#344563',
  ]

  useEffect(() => {
    if (card) {
      setLabels(card.labels || [])
      setChecklists(card.checklists || [])
      setMembers(card.members || [])
      setAttachments(card.attachments || [])
      setCustomFields(card.customFields || [])
    }
    fetchUsers()
  }, [card])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const refreshCard = async () => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}`)
      if (response.ok) {
        const data = await response.json()
        const updatedCard = data.card
        setLabels(updatedCard.labels || [])
        setChecklists(updatedCard.checklists || [])
        setMembers(updatedCard.members || [])
        setAttachments(updatedCard.attachments || [])
        setCustomFields(updatedCard.customFields || [])
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to refresh card:', error)
    }
  }

  // Labels
  const handleAddLabel = async () => {
    if (!card || !newLabelName.trim()) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
      })
      if (response.ok) {
        const data = await response.json()
        setLabels([...labels, data.label])
        setNewLabelName('')
        showToast({ type: 'success', title: 'Label Added', description: 'Label added to card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to add label' })
    }
  }

  const handleRemoveLabel = async (labelId: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/labels/${labelId}`, { method: 'DELETE' })
      if (response.ok) {
        setLabels(labels.filter(l => l.id !== labelId))
        showToast({ type: 'success', title: 'Label Removed', description: 'Label removed from card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to remove label' })
    }
  }

  // Checklists
  const handleCreateChecklist = async () => {
    if (!card || !newChecklistTitle.trim()) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistTitle }),
      })
      if (response.ok) {
        const data = await response.json()
        setChecklists([...checklists, data.checklist])
        setNewChecklistTitle('')
        setActiveSection(null)
        showToast({ type: 'success', title: 'Checklist Created', description: 'Checklist added to card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to create checklist' })
    }
  }

  const handleAddChecklistItem = async (checklistId: string) => {
    if (!card || !newChecklistItemText[checklistId]?.trim()) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/checklists/${checklistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newChecklistItemText[checklistId] }),
      })
      if (response.ok) {
        const data = await response.json()
        setChecklists(checklists.map(c => 
          c.id === checklistId 
            ? { ...c, items: [...c.items, data.item] }
            : c
        ))
        setNewChecklistItemText({ ...newChecklistItemText, [checklistId]: '' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to add checklist item' })
    }
  }

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, isCompleted: boolean) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/checklists/${checklistId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      })
      if (response.ok) {
        setChecklists(checklists.map(c => 
          c.id === checklistId 
            ? { ...c, items: c.items.map(i => i.id === itemId ? { ...i, isCompleted: !isCompleted } : i) }
            : c
        ))
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to update checklist item' })
    }
  }

  // Members
  const handleAddMember = async (userId: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        const data = await response.json()
        setMembers([...members, data.member])
        setActiveSection(null)
        showToast({ type: 'success', title: 'Member Added', description: 'Member assigned to card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to add member' })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/members/${memberId}`, { method: 'DELETE' })
      if (response.ok) {
        setMembers(members.filter(m => m.id !== memberId))
        showToast({ type: 'success', title: 'Member Removed', description: 'Member removed from card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to remove member' })
    }
  }

  // Attachments
  const handleAddAttachment = async () => {
    if (!card || !newAttachmentName.trim() || !newAttachmentUrl.trim()) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAttachmentName, url: newAttachmentUrl, type: newAttachmentType }),
      })
      if (response.ok) {
        const data = await response.json()
        setAttachments([...attachments, data.attachment])
        setNewAttachmentName('')
        setNewAttachmentUrl('')
        setActiveSection(null)
        showToast({ type: 'success', title: 'Attachment Added', description: 'Attachment added to card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to add attachment' })
    }
  }

  const handleRemoveAttachment = async (attachmentId: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/attachments/${attachmentId}`, { method: 'DELETE' })
      if (response.ok) {
        setAttachments(attachments.filter(a => a.id !== attachmentId))
        showToast({ type: 'success', title: 'Attachment Removed', description: 'Attachment removed from card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to remove attachment' })
    }
  }

  // Custom Fields
  const handleAddCustomField = async () => {
    if (!card || !newCustomFieldName.trim()) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/custom-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomFieldName, value: newCustomFieldValue, fieldType: newCustomFieldType }),
      })
      if (response.ok) {
        const data = await response.json()
        setCustomFields([...customFields, data.customField])
        setNewCustomFieldName('')
        setNewCustomFieldValue('')
        setActiveSection(null)
        showToast({ type: 'success', title: 'Custom Field Added', description: 'Custom field added to card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to add custom field' })
    }
  }

  const handleUpdateCustomField = async (fieldId: string, value: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/custom-fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
      if (response.ok) {
        setCustomFields(customFields.map(f => f.id === fieldId ? { ...f, value } : f))
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to update custom field' })
    }
  }

  const handleRemoveCustomField = async (fieldId: string) => {
    if (!card) return
    try {
      const response = await fetch(`/api/admin/cards/${card.id}/custom-fields/${fieldId}`, { method: 'DELETE' })
      if (response.ok) {
        setCustomFields(customFields.filter(f => f.id !== fieldId))
        showToast({ type: 'success', title: 'Custom Field Removed', description: 'Custom field removed from card' })
        refreshCard()
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to remove custom field' })
    }
  }

  const openLocationInMap = () => {
    if (card?.latitude && card?.longitude) {
      window.open(`https://www.google.com/maps?q=${card.latitude},${card.longitude}`, '_blank')
    } else if (location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`, '_blank')
    }
  }

  const addToCardMenuItems = [
    { id: 'labels', icon: '🏷️', label: 'Labels', description: 'Organize, categorize, and prioritize' },
    { id: 'dates', icon: '📅', label: 'Dates', description: 'Start dates, due dates, and reminders' },
    { id: 'checklist', icon: '☑️', label: 'Checklist', description: 'Add subtasks' },
    { id: 'members', icon: '👤', label: 'Members', description: 'Assign members' },
    { id: 'attachment', icon: '📎', label: 'Attachment', description: 'Add links, pages, work items, and more' },
    { id: 'location', icon: '📍', label: 'Location', description: 'View this card on a map' },
    { id: 'custom-fields', icon: '⚙️', label: 'Custom Fields', description: 'Create your own fields' },
  ]

  return (
    <Modal isOpen={true} onClose={onClose} title={card ? 'Edit Card' : 'Create Card'} size="xl">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
              placeholder="Enter card title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <RichTextEditor
              value={description}
              onChange={onDescriptionChange}
              placeholder="Enter card description..."
            />
          </div>

          {/* Labels */}
          {card && labels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Labels</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="px-3 py-1 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {card && members.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Members</label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <Avatar username={member.user.username} src={member.user.avatarUrl} size="sm" />
                    <span className="text-sm text-white">{member.user.username}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklists */}
          {card && checklists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Checklists</label>
              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <div key={checklist.id} className="bg-bg-tertiary p-4 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">{checklist.title}</h4>
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleToggleChecklistItem(checklist.id, item.id, item.isCompleted)}
                            className="w-4 h-4"
                          />
                          <span className={item.isCompleted ? 'line-through text-text-secondary' : 'text-white'}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newChecklistItemText[checklist.id] || ''}
                          onChange={(e) => setNewChecklistItemText({ ...newChecklistItemText, [checklist.id]: e.target.value })}
                          placeholder="Add an item"
                          className="flex-1 px-3 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddChecklistItem(checklist.id)
                            }
                          }}
                        />
                        <Button size="sm" onClick={() => handleAddChecklistItem(checklist.id)}>Add</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {card && attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Attachments</label>
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between bg-bg-tertiary p-3 rounded-lg">
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-electric-blue hover:underline flex items-center gap-2"
                    >
                      <span>{attachment.name}</span>
                      <span className="text-xs text-text-secondary">({attachment.type})</span>
                    </a>
                    <button
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="text-text-secondary hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {card && customFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Custom Fields</label>
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <label className="text-sm text-white w-32">{field.name}:</label>
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(field.id, e.target.value)}
                        className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm"
                      />
                    )}
                    {field.fieldType === 'number' && (
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(field.id, e.target.value)}
                        className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm"
                      />
                    )}
                    {field.fieldType === 'date' && (
                      <input
                        type="date"
                        value={field.value}
                        onChange={(e) => handleUpdateCustomField(field.id, e.target.value)}
                        className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm"
                      />
                    )}
                    {field.fieldType === 'checkbox' && (
                      <input
                        type="checkbox"
                        checked={field.value === 'true'}
                        onChange={(e) => handleUpdateCustomField(field.id, e.target.checked.toString())}
                        className="w-4 h-4"
                      />
                    )}
                    <button
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="text-text-secondary hover:text-red-400"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {card && location && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Location</label>
              <div className="flex items-center gap-2">
                <span className="text-white">{location}</span>
                <Button size="sm" variant="secondary" onClick={openLocationInMap}>
                  View on Map
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-bg-tertiary">
            {card && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
                    try {
                      const response = await fetch(`/api/admin/cards/${card.id}`, { method: 'DELETE' })
                      if (response.ok) {
                        showToast({ type: 'success', title: 'Card Deleted', description: 'Card deleted successfully' })
                        onClose()
                        if (onRefresh) onRefresh()
                      }
                    } catch (error) {
                      showToast({ type: 'error', title: 'Error', description: 'Failed to delete card' })
                    }
                  }
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
              >
                Delete Card
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <Button variant="secondary" onClick={onClose}>
                {card ? 'Close' : 'Cancel'}
              </Button>
              <Button onClick={onSave}>{card ? 'Save' : 'Create'}</Button>
            </div>
          </div>
        </div>

        {/* Add to Card Sidebar */}
        {card && (
          <div className="w-64 space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Add to card</h3>
            {addToCardMenuItems.map((item) => (
              <div key={item.id}>
                <button
                  onClick={() => setActiveSection(activeSection === item.id ? null : item.id)}
                  className="w-full text-left px-3 py-2 bg-bg-tertiary hover:bg-bg-secondary rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-text-secondary">{item.description}</div>
                    </div>
                  </div>
                </button>

                {/* Section Content */}
                {activeSection === item.id && (
                  <div className="mt-2 p-3 bg-bg-tertiary rounded-lg border border-bg-secondary">
                    {item.id === 'labels' && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {labels.map((label) => (
                            <div key={label.id} className="flex items-center gap-1">
                              <span
                                className="px-2 py-1 rounded text-xs font-medium text-white"
                                style={{ backgroundColor: label.color }}
                              >
                                {label.name}
                              </span>
                              <button
                                onClick={() => handleRemoveLabel(label.id)}
                                className="text-text-secondary hover:text-red-400"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newLabelName}
                            onChange={(e) => setNewLabelName(e.target.value)}
                            placeholder="Label name"
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                          <div className="flex gap-1 flex-wrap">
                            {labelColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => setNewLabelColor(color)}
                                className={`w-6 h-6 rounded ${newLabelColor === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <Button size="sm" onClick={handleAddLabel} className="w-full">
                            Add Label
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.id === 'dates' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Start Date</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartDateChange(e.target.value)}
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Due Date</label>
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => onDueDateChange(e.target.value)}
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Reminder</label>
                          <input
                            type="datetime-local"
                            value={reminderDate}
                            onChange={(e) => onReminderDateChange(e.target.value)}
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {item.id === 'checklist' && (
                      <div className="space-y-3">
                        {checklists.map((checklist) => (
                          <div key={checklist.id} className="border-b border-bg-secondary pb-2">
                            <div className="text-xs font-medium text-white mb-1">{checklist.title}</div>
                            <div className="space-y-1">
                              {checklist.items.map((item) => (
                                <label key={item.id} className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.isCompleted}
                                    onChange={() => handleToggleChecklistItem(checklist.id, item.id, item.isCompleted)}
                                    className="w-3 h-3"
                                  />
                                  <span className={`text-xs ${item.isCompleted ? 'line-through text-text-secondary' : 'text-white'}`}>
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                            placeholder="Checklist title"
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                          <Button size="sm" onClick={handleCreateChecklist} className="w-full">
                            Create Checklist
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.id === 'members' && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availableUsers
                          .filter(u => !members.some(m => m.userId === u.id))
                          .map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleAddMember(user.id)}
                              className="w-full flex items-center gap-2 px-2 py-1 hover:bg-bg-secondary rounded text-left"
                            >
                              <Avatar username={user.username} src={user.avatarUrl} size="sm" />
                              <div>
                                <div className="text-xs font-medium text-white">{user.username}</div>
                                <div className="text-xs text-text-secondary">{user.email}</div>
                              </div>
                            </button>
                          ))}
                        {members.length > 0 && (
                          <div className="border-t border-bg-secondary pt-2 mt-2">
                            <div className="text-xs text-text-secondary mb-1">Assigned:</div>
                            {members.map((member) => (
                              <div key={member.id} className="flex items-center justify-between px-2 py-1">
                                <div className="flex items-center gap-2">
                                  <Avatar username={member.user.username} src={member.user.avatarUrl} size="sm" />
                                  <span className="text-xs text-white">{member.user.username}</span>
                                </div>
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="text-text-secondary hover:text-red-400"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {item.id === 'attachment' && (
                      <div className="space-y-2">
                        <select
                          value={newAttachmentType}
                          onChange={(e) => setNewAttachmentType(e.target.value)}
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        >
                          <option value="link">Link</option>
                          <option value="file">File</option>
                          <option value="work_item">Work Item</option>
                        </select>
                        <input
                          type="text"
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          placeholder="Name"
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        />
                        <input
                          type="url"
                          value={newAttachmentUrl}
                          onChange={(e) => setNewAttachmentUrl(e.target.value)}
                          placeholder="URL"
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        />
                        <Button size="sm" onClick={handleAddAttachment} className="w-full">
                          Add Attachment
                        </Button>
                      </div>
                    )}

                    {item.id === 'location' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => onLocationChange(e.target.value)}
                          placeholder="Address or location"
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        />
                        {location && (
                          <Button size="sm" onClick={openLocationInMap} className="w-full" variant="secondary">
                            View on Map
                          </Button>
                        )}
                      </div>
                    )}

                    {item.id === 'custom-fields' && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newCustomFieldName}
                          onChange={(e) => setNewCustomFieldName(e.target.value)}
                          placeholder="Field name"
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        />
                        <select
                          value={newCustomFieldType}
                          onChange={(e) => setNewCustomFieldType(e.target.value)}
                          className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="dropdown">Dropdown</option>
                        </select>
                        {newCustomFieldType !== 'checkbox' && (
                          <input
                            type={newCustomFieldType === 'number' ? 'number' : newCustomFieldType === 'date' ? 'date' : 'text'}
                            value={newCustomFieldValue}
                            onChange={(e) => setNewCustomFieldValue(e.target.value)}
                            placeholder="Field value"
                            className="w-full px-2 py-1 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
                          />
                        )}
                        <Button size="sm" onClick={handleAddCustomField} className="w-full">
                          Add Custom Field
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

