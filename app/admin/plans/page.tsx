'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

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
  isArchived: boolean
  labels: CardLabel[]
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

export default function PlansPage() {
  const { showToast } = useToast()
  const [boards, setBoards] = useState<Board[]>([])
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/boards')
      if (response.ok) {
        const data = await response.json()
        setBoards(data.boards || [])
        if (data.boards && data.boards.length > 0 && !selectedBoard) {
          setSelectedBoard(data.boards[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch boards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBoard = async (boardId: string) => {
    try {
      const response = await fetch(`/api/admin/boards/${boardId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedBoard(data.board)
        // Update in boards array
        setBoards(boards.map(b => b.id === boardId ? data.board : b))
      }
    } catch (error) {
      console.error('Failed to fetch board:', error)
    }
  }

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Board name is required',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName }),
      })

      if (response.ok) {
        const data = await response.json()
        setBoards([...boards, data.board])
        setSelectedBoard(data.board)
        setNewBoardName('')
        setIsCreateBoardModalOpen(false)
        showToast({
          type: 'success',
          title: 'Board Created',
          description: 'New board created successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create board',
      })
    }
  }

  const handleCreateList = async () => {
    if (!newListName.trim() || !selectedBoard) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'List name is required',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: selectedBoard.id,
          name: newListName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchBoard(selectedBoard.id)
        setNewListName('')
        setIsCreateListModalOpen(false)
        showToast({
          type: 'success',
          title: 'List Created',
          description: 'New list created successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create list',
      })
    }
  }

  const handleCreateCard = async (listId: string) => {
    if (!cardTitle.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Card title is required',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          title: cardTitle,
          description: cardDescription || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (selectedBoard) {
          await fetchBoard(selectedBoard.id)
        }
        setCardTitle('')
        setCardDescription('')
        setIsCardModalOpen(false)
        showToast({
          type: 'success',
          title: 'Card Created',
          description: 'New card created successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create card',
      })
    }
  }

  const handleUpdateCard = async () => {
    if (!selectedCard || !cardTitle.trim()) {
      return
    }

    try {
      const response = await fetch(`/api/admin/cards/${selectedCard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cardTitle,
          description: cardDescription || null,
          dueDate: cardDueDate || null,
        }),
      })

      if (response.ok) {
        if (selectedBoard) {
          await fetchBoard(selectedBoard.id)
        }
        setIsCardModalOpen(false)
        setSelectedCard(null)
        showToast({
          type: 'success',
          title: 'Card Updated',
          description: 'Card updated successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update card',
      })
    }
  }

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const response = await fetch(`/api/admin/cards/${cardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (selectedBoard) {
          await fetchBoard(selectedBoard.id)
        }
        showToast({
          type: 'success',
          title: 'Card Deleted',
          description: 'Card deleted successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete card',
      })
    }
  }

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this list? All cards will be deleted.')) return

    try {
      const response = await fetch(`/api/admin/lists/${listId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        if (selectedBoard) {
          await fetchBoard(selectedBoard.id)
        }
        showToast({
          type: 'success',
          title: 'List Deleted',
          description: 'List deleted successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete list',
      })
    }
  }

  // Drag and drop handlers
  const handleCardDragStart = (card: Card) => {
    setDraggedCard(card)
  }

  const handleCardDragEnd = async (targetListId: string, targetPosition: number) => {
    if (!draggedCard || !selectedBoard) return

    const sourceList = selectedBoard.lists.find(l => l.id === draggedCard.listId)
    if (!sourceList) return

    const oldPosition = draggedCard.position
    const oldListId = draggedCard.listId

    // If same list and position, do nothing
    if (oldListId === targetListId && oldPosition === targetPosition) {
      setDraggedCard(null)
      return
    }

    try {
      const response = await fetch('/api/admin/cards/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: draggedCard.id,
          newListId: targetListId,
          newPosition: targetPosition,
          oldListId,
          oldPosition,
        }),
      })

      if (response.ok) {
        await fetchBoard(selectedBoard.id)
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to reorder' }))
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to reorder card',
        })
      }
    } catch (error) {
      console.error('Failed to reorder card:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reorder card',
      })
    } finally {
      setDraggedCard(null)
    }
  }

  const handleListDragStart = (list: List) => {
    setDraggedList(list)
  }

  const handleListDragEnd = async (newPosition: number) => {
    if (!draggedList || !selectedBoard) return

    const oldPosition = draggedList.position

    // If same position, do nothing
    if (oldPosition === newPosition) {
      setDraggedList(null)
      return
    }

    try {
      const response = await fetch('/api/admin/lists/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId: draggedList.id,
          newPosition,
          oldPosition,
          boardId: selectedBoard.id,
        }),
      })

      if (response.ok) {
        await fetchBoard(selectedBoard.id)
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to reorder' }))
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to reorder list',
        })
      }
    } catch (error) {
      console.error('Failed to reorder list:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reorder list',
      })
    } finally {
      setDraggedList(null)
    }
  }

  const openCardModal = (card?: Card, listId?: string) => {
    if (card) {
      setSelectedCard(card)
      setCardTitle(card.title)
      setCardDescription(card.description || '')
      setCardDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '')
    } else {
      setSelectedCard(null)
      setCardTitle('')
      setCardDescription('')
      setCardDueDate('')
      if (listId) {
        // Store listId for creating new card
        (window as any).__tempListId = listId
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
                const board = boards.find(b => b.id === e.target.value)
                setSelectedBoard(board || null)
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
            className="rounded-lg p-6 text-white"
            style={{ backgroundColor: selectedBoard.color }}
          >
            <h2 className="text-2xl font-bold mb-2">{selectedBoard.name}</h2>
            {selectedBoard.description && (
              <p className="text-white/80">{selectedBoard.description}</p>
            )}
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
                onListDragEnd={() => {
                  // For now, list reordering is manual via position updates
                  // Can be enhanced with drag-and-drop later
                }}
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
              <Button onClick={handleCreateBoard}>Create</Button>
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
              <Button onClick={handleCreateList}>Create</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Card Modal */}
      {isCardModalOpen && (
        <CardModal
          card={selectedCard}
          title={cardTitle}
          description={cardDescription}
          dueDate={cardDueDate}
          onTitleChange={setCardTitle}
          onDescriptionChange={setCardDescription}
          onDueDateChange={setCardDueDate}
          onSave={() => {
            if (selectedCard) {
              handleUpdateCard()
            } else {
              const listId = (window as any).__tempListId
              if (listId) {
                handleCreateCard(listId)
              }
            }
          }}
          onClose={() => {
            setIsCardModalOpen(false)
            setSelectedCard(null)
            setCardTitle('')
            setCardDescription('')
            setCardDueDate('')
            delete (window as any).__tempListId
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

  const handleUpdateListName = async () => {
    if (!listName.trim()) {
      setListName(list.name)
      setIsEditingName(false)
      return
    }

    try {
      const response = await fetch(`/api/admin/lists/${list.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: listName }),
      })

      if (response.ok) {
        setIsEditingName(false)
        showToast({
          type: 'success',
          title: 'List Updated',
          description: 'List name updated successfully',
        })
        window.location.reload() // Refresh to get updated data
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update list name',
      })
    }
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
          onClick={() => onDeleteList(list.id)}
          className="text-text-secondary hover:text-red-400 transition-colors"
          title="Delete list"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        {isHovered && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-text-secondary hover:text-red-400 transition-colors"
            title="Delete card"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
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

  const labelColors = [
    '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
    '#c377e0', '#0079bf', '#00c2e0', '#51e898',
    '#ff78cb', '#344563',
  ]

  const handleAddLabel = async () => {
    if (!card || !newLabelName.trim()) return

    try {
      const response = await fetch(`/api/admin/cards/${card.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLabelName,
          color: newLabelColor,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLabels([...labels, data.label])
        setNewLabelName('')
        showToast({
          type: 'success',
          title: 'Label Added',
          description: 'Label added to card',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to add label',
      })
    }
  }

  const handleRemoveLabel = async (labelId: string) => {
    if (!card) return

    try {
      const response = await fetch(`/api/admin/cards/${card.id}/labels/${labelId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLabels(labels.filter(l => l.id !== labelId))
        showToast({
          type: 'success',
          title: 'Label Removed',
          description: 'Label removed from card',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to remove label',
      })
    }
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

        <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary">
          <Button variant="secondary" onClick={onClose}>
            {card ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={onSave}>
            {card ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

