'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

interface CalendarItem {
  id: string
  contentType: string
  title: string | null
  description: string | null
  scheduledDate: string
  scheduledTime: string | null
  status: string
  platform: string | null
  strategy: {
    id: string
    name: string
  } | null
  socialPost: {
    id: string
    platform: string
  } | null
  blogPost: {
    id: string
    title: string
  } | null
  newsletter: {
    id: string
    subject: string
  } | null
}

export function ContentCalendar() {
  const { showToast } = useToast()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // New item form
  const [newItemType, setNewItemType] = useState('SOCIAL_POST')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDate, setNewItemDate] = useState('')
  const [newItemTime, setNewItemTime] = useState('09:00')
  const [newItemPlatform, setNewItemPlatform] = useState('INSTAGRAM')

  useEffect(() => {
    fetchCalendarItems()
  }, [currentDate, view])

  const fetchCalendarItems = async () => {
    try {
      setIsLoading(true)
      const start = new Date(currentDate)
      if (view === 'month') {
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
      } else {
        // Week view - get Monday of current week
        const day = start.getDay()
        const diff = start.getDate() - day + (day === 0 ? -6 : 1)
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
      }

      const end = new Date(start)
      if (view === 'month') {
        end.setMonth(end.getMonth() + 1)
      } else {
        end.setDate(end.getDate() + 7)
      }

      const response = await fetch(
        `/api/admin/marketing/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch calendar items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateItem = async () => {
    if (!newItemDate) {
      showToast({
        type: 'error',
        title: 'Missing Date',
        description: 'Please select a date',
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch('/api/admin/marketing/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: newItemType,
          title: newItemTitle || undefined,
          scheduledDate: newItemDate,
          scheduledTime: newItemTime || undefined,
          platform: newItemType === 'SOCIAL_POST' ? newItemPlatform : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create calendar item')
      }

      showToast({
        type: 'success',
        title: 'Item Created',
        description: 'Calendar item created successfully',
      })

      setIsModalOpen(false)
      setNewItemTitle('')
      setNewItemDate('')
      setNewItemTime('09:00')
      fetchCalendarItems()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        description: error.message || 'Failed to create calendar item',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return items.filter((item) => {
      const itemDate = new Date(item.scheduledDate).toISOString().split('T')[0]
      return itemDate === dateStr
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'SENT':
        return 'bg-green-500/20 text-green-400'
      case 'APPROVED':
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'SOCIAL_POST':
        return '📱'
      case 'BLOG_POST':
        return '📝'
      case 'NEWSLETTER':
        return '📧'
      case 'VIDEO':
        return '🎥'
      default:
        return '📄'
    }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigateMonth('prev')}>
            ← Previous
          </Button>
          <h2 className="text-2xl font-bold text-white">{monthName}</h2>
          <Button variant="secondary" onClick={() => navigateMonth('next')}>
            Next →
          </Button>
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-bg-tertiary p-1 rounded-lg">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-electric-blue text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-electric-blue text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Add Content
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' ? (
        <Card>
          <CardBody>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-text-secondary">
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="min-h-[100px] p-2 border border-bg-tertiary rounded-lg" />
                ))}

                {/* Days of month */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1
                  const date = new Date(year, month, day)
                  const dayItems = getItemsForDate(date)
                  const isToday =
                    date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={day}
                      className={`min-h-[100px] p-2 border rounded-lg ${
                        isToday
                          ? 'border-electric-blue bg-electric-blue/10'
                          : 'border-bg-tertiary bg-bg-secondary'
                      }`}
                    >
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday ? 'text-electric-blue' : 'text-white'
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="text-xs p-1 rounded bg-bg-tertiary hover:bg-bg-tertiary/80 cursor-pointer"
                          >
                            <div className="flex items-center gap-1">
                              <span>{getContentTypeIcon(item.contentType)}</span>
                              <span className="truncate text-white">
                                {item.title || item.contentType.replace('_', ' ')}
                              </span>
                            </div>
                            <Badge className={`${getStatusColor(item.status)} text-xs mt-1`}>
                              {item.status}
                            </Badge>
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-text-secondary">
                            +{dayItems.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="text-text-secondary text-center py-8">Week view coming soon...</p>
          </CardBody>
        </Card>
      )}

      {/* Create Item Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Schedule Content"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Content Type *
              </label>
              <select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
              >
                <option value="SOCIAL_POST">Social Media Post</option>
                <option value="BLOG_POST">Blog Post</option>
                <option value="NEWSLETTER">Email Newsletter</option>
                <option value="VIDEO">Video Content</option>
              </select>
            </div>

            {newItemType === 'SOCIAL_POST' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Platform *
                </label>
                <select
                  value={newItemPlatform}
                  onChange={(e) => setNewItemPlatform(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                >
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="TWITTER">Twitter/X</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Title
              </label>
              <Input
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Content title (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Date *
                </label>
                <Input
                  type="date"
                  value={newItemDate}
                  onChange={(e) => setNewItemDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Time
                </label>
                <Input
                  type="time"
                  value={newItemTime}
                  onChange={(e) => setNewItemTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateItem}
                isLoading={isCreating}
                disabled={!newItemDate}
              >
                Schedule
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title || selectedItem.contentType.replace('_', ' ')}
        >
          <div className="space-y-4">
            <div>
              <Badge className={getStatusColor(selectedItem.status)}>
                {selectedItem.status}
              </Badge>
              <Badge className="ml-2 bg-electric-blue/20 text-electric-blue">
                {selectedItem.contentType.replace('_', ' ')}
              </Badge>
              {selectedItem.platform && (
                <Badge className="ml-2">{selectedItem.platform}</Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-text-secondary">Scheduled</p>
              <p className="text-white">
                {new Date(selectedItem.scheduledDate).toLocaleDateString()}
                {selectedItem.scheduledTime && ` at ${selectedItem.scheduledTime}`}
              </p>
            </div>

            {selectedItem.description && (
              <div>
                <p className="text-sm text-text-secondary">Description</p>
                <p className="text-white">{selectedItem.description}</p>
              </div>
            )}

            {selectedItem.strategy && (
              <div>
                <p className="text-sm text-text-secondary">Strategy</p>
                <p className="text-white">{selectedItem.strategy.name}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              {selectedItem.status === 'DRAFT' && (
                <>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/admin/marketing/calendar/${selectedItem.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            status: 'APPROVED',
                            approvedAt: new Date().toISOString(),
                          }),
                        })
                        if (response.ok) {
                          showToast({
                            type: 'success',
                            title: 'Approved',
                            description: 'Content item approved',
                          })
                          setSelectedItem(null)
                          fetchCalendarItems()
                        }
                      } catch (error) {
                        showToast({
                          type: 'error',
                          title: 'Error',
                          description: 'Failed to approve item',
                        })
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/admin/marketing/calendar/${selectedItem.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'CANCELLED' }),
                        })
                        if (response.ok) {
                          showToast({
                            type: 'success',
                            title: 'Cancelled',
                            description: 'Content item cancelled',
                          })
                          setSelectedItem(null)
                          fetchCalendarItems()
                        }
                      } catch (error) {
                        showToast({
                          type: 'error',
                          title: 'Error',
                          description: 'Failed to cancel item',
                        })
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

