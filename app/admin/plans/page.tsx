'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'
import { CardModalEnhanced } from '@/components/admin/CardModalEnhanced'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor').then(m => ({ default: m.RichTextEditor })), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-bg-tertiary rounded-lg animate-pulse" />,
})

interface Board {
  id: string
  name: string
  description: string | null
  color: string
  isArchived: boolean
  lists: List[]
  createdAt: string
  updatedAt: string
}

interface List {
  id: string
  boardId: string
  name: string
  position: number
  isArchived: boolean
  cards: Card[]
  createdAt: string
  updatedAt: string
}

interface Card {
  id: string
  listId: string
  title: string
  description: string | null
  position: number
  dueDate: string | null
  startDate: string | null
  reminderDate: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  isArchived: boolean
  labels: CardLabel[]
  checklists?: Array<{
    id: string
    title: string
    items: Array<{
      id: string
      text: string
      isCompleted: boolean
    }>
  }>
  members?: Array<{
    id: string
    userId: string
    user: {
      id: string
      username: string
      email: string
      avatarUrl: string | null
    }
  }>
  attachments?: Array<{
    id: string
    name: string
    url: string
    type: string
  }>
  customFields?: Array<{
    id: string
    name: string
    value: string
    fieldType: string
  }>
  createdAt: string
  updatedAt: string
}

interface CardLabel {
  id: string
  cardId: string
  name: string
  color: string
  createdAt: string
}

interface BoardsResponse {
  boards: Board[]
}

interface BoardResponse {
  board: Board
}

export default function PlansPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false)
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [draggedCard, setDraggedCard] = useState<Card | null>(null)
  const [draggedList, setDraggedList] = useState<List | null>(null)
  const [newBoardName, setNewBoardName] = useState('')
  const [newListName, setNewListName] = useState('')
  const [cardTitle, setCardTitle] = useState('')
  const [cardDescription, setCardDescription] = useState('')
  const [cardDueDate, setCardDueDate] = useState('')
  const [cardStartDate, setCardStartDate] = useState('')
  const [cardReminderDate, setCardReminderDate] = useState('')
  const [cardLocation, setCardLocation] = useState('')
  const [tempListId, setTempListId] = useState<string | null>(null)

  // --- Queries ---

  const {
    data: boardsData,
    isLoading,
    error: boardsError,
    refetch: refetchBoards,
  } = useQuery({
    queryKey: ['admin', 'boards'],
    queryFn: () => fetchClient<BoardsResponse>('/api/admin/boards'),
  })

  const boards = boardsData?.boards || []

  // Auto-select first board if none selected
  const selectedBoard = boards.find(b => b.id === selectedBoardId) || boards[0] || null
  if (selectedBoard && selectedBoardId !== selectedBoard.id) {
    // Sync the local state (will re-render)
    setTimeout(() => setSelectedBoardId(selectedBoard.id), 0)
  }

  // --- Mutations ---

  const createBoardMutation = useMutation({
    mutationFn: (name: string) =>
      fetchClient<{ board: Board }>('/api/admin/boards', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      setSelectedBoardId(data.board.id)
      setNewBoardName('')
      setIsCreateBoardModalOpen(false)
      showToast({
        type: 'success',
        title: 'Board Created',
        description: 'New board created successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create board',
      })
    },
  })

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) =>
      fetchClient<void>(`/api/admin/boards/${boardId}`, { method: 'DELETE' }),
    onSuccess: (_, boardId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      if (selectedBoardId === boardId) {
        setSelectedBoardId(null)
      }
      showToast({
        type: 'success',
        title: 'Board Deleted',
        description: 'Board deleted successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete board',
      })
    },
  })

  const createListMutation = useMutation({
    mutationFn: (params: { boardId: string; name: string }) =>
      fetchClient<{ list: List }>('/api/admin/lists', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      setNewListName('')
      setIsCreateListModalOpen(false)
      showToast({
        type: 'success',
        title: 'List Created',
        description: 'New list created successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create list',
      })
    },
  })

  const deleteListMutation = useMutation({
    mutationFn: (listId: string) =>
      fetchClient<void>(`/api/admin/lists/${listId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      showToast({
        type: 'success',
        title: 'List Deleted',
        description: 'List deleted successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete list',
      })
    },
  })

  const createCardMutation = useMutation({
    mutationFn: (params: { listId: string; title: string; description: string | null }) =>
      fetchClient<{ card: Card }>('/api/admin/cards', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      setCardTitle('')
      setCardDescription('')
      setIsCardModalOpen(false)
      setTempListId(null)
      showToast({
        type: 'success',
        title: 'Card Created',
        description: 'New card created successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create card',
      })
    },
  })

  const updateCardMutation = useMutation({
    mutationFn: (params: {
      cardId: string
      title: string
      description: string | null
      dueDate: string | null
      startDate: string | null
      reminderDate: string | null
      location: string | null
    }) =>
      fetchClient<{ card: Card }>(`/api/admin/cards/${params.cardId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          dueDate: params.dueDate,
          startDate: params.startDate,
          reminderDate: params.reminderDate,
          location: params.location,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      setIsCardModalOpen(false)
      setSelectedCard(null)
      showToast({
        type: 'success',
        title: 'Card Updated',
        description: 'Card updated successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update card',
      })
    },
  })

  const deleteCardMutation = useMutation({
    mutationFn: (cardId: string) =>
      fetchClient<void>(`/api/admin/cards/${cardId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      showToast({
        type: 'success',
        title: 'Card Deleted',
        description: 'Card deleted successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete card',
      })
    },
  })

  const reorderCardMutation = useMutation({
    mutationFn: (params: {
      cardId: string
      newListId: string
      newPosition: number
      oldListId: string
      oldPosition: number
    }) =>
      fetchClient<void>('/api/admin/cards/reorder', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reorder card',
      })
    },
  })

  const reorderListMutation = useMutation({
    mutationFn: (params: {
      listId: string
      newPosition: number
      oldPosition: number
      boardId: string
    }) =>
      fetchClient<void>('/api/admin/lists/reorder', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reorder list',
      })
    },
  })

  // --- Handlers ---

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Board name is required',
      })
      return
    }
    createBoardMutation.mutate(newBoardName)
  }

  const handleCreateList = () => {
    if (!newListName.trim() || !selectedBoard) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'List name is required',
      })
      return
    }
    createListMutation.mutate({
      boardId: selectedBoard.id,
      name: newListName,
    })
  }

  const handleCreateCard = (listId: string) => {
    if (!cardTitle.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Card title is required',
      })
      return
    }
    createCardMutation.mutate({
      listId,
      title: cardTitle,
      description: cardDescription || null,
    })
  }

  const handleUpdateCard = () => {
    if (!selectedCard || !cardTitle.trim()) return
    updateCardMutation.mutate({
      cardId: selectedCard.id,
      title: cardTitle,
      description: cardDescription || null,
      dueDate: cardDueDate || null,
      startDate: cardStartDate || null,
      reminderDate: cardReminderDate || null,
      location: cardLocation || null,
    })
  }

  const handleDeleteCard = (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return
    deleteCardMutation.mutate(cardId)
  }

  const handleDeleteList = (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All cards will be deleted.')) return
    deleteListMutation.mutate(listId)
  }

  const handleDeleteBoard = (boardId: string) => {
    if (!confirm('Are you sure you want to delete this board? All lists and cards will be permanently deleted.')) return
    deleteBoardMutation.mutate(boardId)
  }

  // Drag and drop handlers
  const handleCardDragStart = (card: Card) => {
    setDraggedCard(card)
  }

  const handleCardDragEnd = (targetListId: string, targetPosition: number) => {
    if (!draggedCard || !selectedBoard) return

    const sourceList = selectedBoard.lists.find(l => l.id === draggedCard.listId)
    if (!sourceList) return

    const oldPosition = draggedCard.position
    const oldListId = draggedCard.listId

    if (oldListId === targetListId && oldPosition === targetPosition) {
      setDraggedCard(null)
      return
    }

    reorderCardMutation.mutate({
      cardId: draggedCard.id,
      newListId: targetListId,
      newPosition: targetPosition,
      oldListId,
      oldPosition,
    })
    setDraggedCard(null)
  }

  const handleListDragStart = (list: List) => {
    setDraggedList(list)
  }

  const handleListDragEnd = (newPosition: number) => {
    if (!draggedList || !selectedBoard) return

    const oldPosition = draggedList.position

    if (oldPosition === newPosition) {
      setDraggedList(null)
      return
    }

    reorderListMutation.mutate({
      listId: draggedList.id,
      newPosition,
      oldPosition,
      boardId: selectedBoard.id,
    })
    setDraggedList(null)
  }

  const openCardModal = (card?: Card, listId?: string) => {
    if (card) {
      setSelectedCard(card)
      setCardTitle(card.title)
      setCardDescription(card.description || '')
      setCardDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '')
      setCardStartDate(card.startDate ? new Date(card.startDate).toISOString().split('T')[0] : '')
      setCardReminderDate(card.reminderDate ? new Date(card.reminderDate).toISOString().slice(0, 16) : '')
      setCardLocation(card.location || '')
      setTempListId(null)
    } else {
      setSelectedCard(null)
      setCardTitle('')
      setCardDescription('')
      setCardDueDate('')
      setCardStartDate('')
      setCardReminderDate('')
      setCardLocation('')
      if (listId) {
        setTempListId(listId)
      }
    }
    setIsCardModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (boardsError) {
    return (
      <ErrorDisplay
        title="Failed to load boards"
        message={boardsError instanceof Error ? boardsError.message : 'Something went wrong loading your boards.'}
        onRetry={() => refetchBoards()}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plans</h1>
          <p className="text-text-secondary">Manage your project plans with Trello-like boards</p>
        </div>
        <div className="flex gap-4">
          {boards.length > 0 && (
            <select
              value={selectedBoard?.id || ''}
              onChange={(e) => {
                setSelectedBoardId(e.target.value || null)
              }}
              className="px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
            >
              {boards.map(board => (
                <option key={board.id} value={board.id}>{board.name}</option>
              ))}
            </select>
          )}
          <Button onClick={() => setIsCreateBoardModalOpen(true)}>
            + New Board
          </Button>
        </div>
      </div>

      {selectedBoard ? (
        <div className="space-y-4">
          {/* Board Header */}
          <div
            className="rounded-lg p-6 text-white relative"
            style={{ backgroundColor: selectedBoard.color }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedBoard.name}</h2>
                {selectedBoard.description && (
                  <p className="text-white/80">{selectedBoard.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteBoard(selectedBoard.id)}
                className="ml-4 p-2 bg-white/20 hover:bg-red-500/80 rounded-lg transition-colors"
                title="Delete board"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Lists Container - Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
            {selectedBoard.lists.map((list, listIndex) => (
              <ListColumn
                key={list.id}
                list={list}
                onAddCard={() => openCardModal(undefined, list.id)}
                onCardClick={(card) => openCardModal(card)}
                onDeleteCard={handleDeleteCard}
                onDeleteList={handleDeleteList}
                onCardDragStart={handleCardDragStart}
                onCardDragEnd={(position) => handleCardDragEnd(list.id, position)}
                onListDragStart={() => handleListDragStart(list)}
                onListDragEnd={() => handleListDragEnd(listIndex)}
                draggedCard={draggedCard}
                draggedList={draggedList}
              />
            ))}

            {/* Add List Button */}
            <div className="flex-shrink-0 w-72">
              <button
                onClick={() => setIsCreateListModalOpen(true)}
                className="w-full h-12 bg-bg-tertiary hover:bg-bg-secondary border-2 border-dashed border-bg-tertiary rounded-lg text-text-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another list
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-secondary mb-4">No boards yet. Create your first board to get started.</p>
          <Button onClick={() => setIsCreateBoardModalOpen(true)}>
            Create Board
          </Button>
        </div>
      )}

      {/* Create Board Modal */}
      {isCreateBoardModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsCreateBoardModalOpen(false)
            setNewBoardName('')
          }}
          title="Create New Board"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Board Name</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                placeholder="Enter board name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBoard()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateBoardModalOpen(false)
                  setNewBoardName('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={createBoardMutation.isPending}>
                {createBoardMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create List Modal */}
      {isCreateListModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsCreateListModalOpen(false)
            setNewListName('')
          }}
          title="Create New List"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">List Name</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                placeholder="Enter list name"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateList()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreateListModalOpen(false)
                  setNewListName('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateList} disabled={createListMutation.isPending}>
                {createListMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Card Modal */}
      {isCardModalOpen && (
        <CardModalEnhanced
          card={selectedCard}
          title={cardTitle}
          description={cardDescription}
          dueDate={cardDueDate}
          startDate={cardStartDate}
          reminderDate={cardReminderDate}
          location={cardLocation}
          onTitleChange={setCardTitle}
          onDescriptionChange={setCardDescription}
          onDueDateChange={setCardDueDate}
          onStartDateChange={setCardStartDate}
          onReminderDateChange={setCardReminderDate}
          onLocationChange={setCardLocation}
          onSave={() => {
            if (selectedCard) {
              handleUpdateCard()
            } else if (tempListId) {
              handleCreateCard(tempListId)
            }
          }}
          onClose={() => {
            setIsCardModalOpen(false)
            setSelectedCard(null)
            setCardTitle('')
            setCardDescription('')
            setCardDueDate('')
            setCardStartDate('')
            setCardReminderDate('')
            setCardLocation('')
            setTempListId(null)
          }}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
          }}
        />
      )}
    </div>
  )
}

// List Column Component
function ListColumn({
  list,
  onAddCard,
  onCardClick,
  onDeleteCard,
  onDeleteList,
  onCardDragStart,
  onCardDragEnd,
  onListDragStart,
  onListDragEnd,
  draggedCard,
  draggedList,
}: {
  list: List
  onAddCard: () => void
  onCardClick: (card: Card) => void
  onDeleteCard: (cardId: string) => void
  onDeleteList: (listId: string) => void
  onCardDragStart: (card: Card) => void
  onCardDragEnd: (position: number) => void
  onListDragStart: () => void
  onListDragEnd: () => void
  draggedCard: Card | null
  draggedList: List | null
}) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [listName, setListName] = useState(list.name)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const updateListNameMutation = useMutation({
    mutationFn: (name: string) =>
      fetchClient<void>(`/api/admin/lists/${list.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      setIsEditingName(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      showToast({
        type: 'success',
        title: 'List Updated',
        description: 'List name updated successfully',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update list name',
      })
    },
  })

  const handleUpdateListName = () => {
    if (!listName.trim()) {
      setListName(list.name)
      setIsEditingName(false)
      return
    }
    updateListNameMutation.mutate(listName)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    if (draggedCard) {
      const rect = (e.currentTarget as HTMLElement).querySelector('.cards-container')?.getBoundingClientRect()
      if (!rect) return

      const y = e.clientY - rect.top
      const cardHeight = 120 // Approximate card height with spacing
      let position = Math.max(0, Math.floor(y / cardHeight))

      // Ensure position doesn't exceed list length
      if (draggedCard.listId === list.id) {
        // Same list - adjust position if needed
        const currentIndex = list.cards.findIndex(c => c.id === draggedCard.id)
        if (position > currentIndex) position -= 1
      } else {
        // Different list - position can be at the end
        position = Math.min(position, list.cards.length)
      }

      onCardDragEnd(position)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  return (
    <div
      className="flex-shrink-0 w-72 bg-bg-secondary rounded-lg p-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{
        border: isDraggingOver ? '2px dashed #00d9ff' : '1px solid rgba(255,255,255,0.1)',
        backgroundColor: isDraggingOver ? 'rgba(0, 217, 255, 0.1)' : undefined,
      }}
    >
      {/* List Header */}
      <div className="flex items-center justify-between mb-4">
        {isEditingName ? (
          <input
            type="text"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            onBlur={handleUpdateListName}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUpdateListName()
              }
            }}
            className="flex-1 px-2 py-1 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm font-semibold"
            autoFocus
          />
        ) : (
          <h3
            className="text-sm font-semibold text-white cursor-pointer flex-1"
            onClick={() => setIsEditingName(true)}
          >
            {list.name}
          </h3>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteList(list.id)
          }}
          className="p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
          title="Delete list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Cards */}
      <div className="cards-container space-y-2 mb-4 min-h-[100px]">
        {list.cards.map((card, index) => (
          <CardItem
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
            onDelete={() => onDeleteCard(card.id)}
            onDragStart={() => onCardDragStart(card)}
            isDragging={draggedCard?.id === card.id}
          />
        ))}
        {draggedCard && draggedCard.listId !== list.id && (
          <div className="h-24 border-2 border-dashed border-electric-blue rounded-lg flex items-center justify-center text-text-secondary text-sm">
            Drop card here
          </div>
        )}
      </div>

      {/* Add Card Button */}
      <button
        onClick={onAddCard}
        className="w-full py-2 text-text-secondary hover:text-white hover:bg-bg-tertiary rounded transition-colors text-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add a card
      </button>
    </div>
  )
}

// Card Item Component
function CardItem({
  card,
  onClick,
  onDelete,
  onDragStart,
  isDragging,
}: {
  card: Card
  onClick: () => void
  onDelete: () => void
  onDragStart: () => void
  isDragging: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', card.id)
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-bg-tertiary rounded-lg p-3 cursor-pointer hover:bg-bg-primary transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-white text-sm font-medium mb-2">{card.title}</p>
          {card.description && (
            <p className="text-text-secondary text-xs line-clamp-2 mb-2">
              {card.description.replace(/<[^>]*>/g, '').substring(0, 100)}
            </p>
          )}
          {card.dueDate && (
            <div className="flex items-center gap-1 text-xs text-text-secondary mb-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(card.dueDate).toLocaleDateString()}
            </div>
          )}
          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map((label) => (
                <span
                  key={label.id}
                  className="px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className={`p-1.5 text-text-secondary hover:text-red-400 hover:bg-red-500/20 rounded transition-colors ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
          title="Delete card"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Card Modal Component
function CardModal({
  card,
  title,
  description,
  dueDate,
  onTitleChange,
  onDescriptionChange,
  onDueDateChange,
  onSave,
  onClose,
}: {
  card: Card | null
  title: string
  description: string
  dueDate: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}) {
  const [labels, setLabels] = useState<CardLabel[]>(card?.labels || [])
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#61bd4f')
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const labelColors = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
    '#c377e0', '#0079bf', '#00c2e0', '#51e898',
    '#ff78cb', '#344563',
  ]

  const addLabelMutation = useMutation({
    mutationFn: (params: { name: string; color: string }) =>
      fetchClient<{ label: CardLabel }>(`/api/admin/cards/${card!.id}/labels`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      setLabels([...labels, data.label])
      setNewLabelName('')
      showToast({
        type: 'success',
        title: 'Label Added',
        description: 'Label added to card',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to add label',
      })
    },
  })

  const removeLabelMutation = useMutation({
    mutationFn: (labelId: string) =>
      fetchClient<void>(`/api/admin/cards/${card!.id}/labels/${labelId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, labelId) => {
      setLabels(labels.filter(l => l.id !== labelId))
      showToast({
        type: 'success',
        title: 'Label Removed',
        description: 'Label removed from card',
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to remove label',
      })
    },
  })

  const deleteCardInModalMutation = useMutation({
    mutationFn: () =>
      fetchClient<void>(`/api/admin/cards/${card!.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'boards'] })
      showToast({
        type: 'success',
        title: 'Card Deleted',
        description: 'Card deleted successfully',
      })
      onClose()
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete card',
      })
    },
  })

  const handleAddLabel = () => {
    if (!card || !newLabelName.trim()) return
    addLabelMutation.mutate({ name: newLabelName, color: newLabelColor })
  }

  const handleRemoveLabel = (labelId: string) => {
    if (!card) return
    removeLabelMutation.mutate(labelId)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={card ? 'Edit Card' : 'Create Card'}
      size="lg"
    >
      <div className="space-y-6">
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

        <div>
          <label className="block text-sm font-medium text-white mb-2">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
          />
        </div>

        {card && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Labels</label>
            <div className="space-y-3">
              {labels.map((label) => (
                <div key={label.id} className="flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded text-sm font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                  <button
                    onClick={() => handleRemoveLabel(label.id)}
                    className="text-text-secondary hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Label name"
                  className="flex-1 px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded text-white text-sm"
                />
                <div className="flex gap-1">
                  {labelColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-6 h-6 rounded ${
                        newLabelColor === color ? 'ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddLabel}
                  className="px-3 py-2 bg-electric-blue text-black rounded text-sm font-semibold hover:bg-[#00B8E6]"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-bg-tertiary">
          {card && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
                  deleteCardInModalMutation.mutate()
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
            <Button onClick={onSave}>
              {card ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
