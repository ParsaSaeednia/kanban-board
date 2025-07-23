"use client"

import type React from "react"
import { useState, useMemo } from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, Search, Filter, Calendar, MoreHorizontal, Edit, Trash2, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getContrastColor } from "./utils/color-utils"
import ColorPicker from "./components/color-picker"

// Types
interface KanbanCard {
  id: string
  title: string
  description: string
  columnId: string
  priority: "low" | "medium" | "high"
  dueDate?: string
  assignee?: {
    id: string
    name: string
    avatar: string
  }
  labels: string[]
  createdAt: string
  backgroundColor?: string
}

interface Column {
  id: string
  title: string
  color: string
  cards: KanbanCard[]
}

// Mock data
const initialColumns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-slate-100",
    cards: [
      {
        id: "1",
        title: "Design new landing page",
        description: "Create wireframes and mockups for the new landing page design",
        columnId: "todo",
        priority: "high",
        dueDate: "2024-01-15",
        assignee: {
          id: "1",
          name: "Alice Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        labels: ["Design", "Frontend"],
        createdAt: "2024-01-10",
        backgroundColor: "#dbeafe",
      },
      {
        id: "2",
        title: "Set up CI/CD pipeline",
        description: "Configure automated testing and deployment",
        columnId: "todo",
        priority: "medium",
        dueDate: "2024-01-20",
        assignee: {
          id: "2",
          name: "Bob Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        labels: ["DevOps", "Backend"],
        createdAt: "2024-01-11",
        backgroundColor: "#dcfce7",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-blue-100",
    cards: [
      {
        id: "3",
        title: "Implement user authentication",
        description: "Add login, signup, and password reset functionality",
        columnId: "in-progress",
        priority: "high",
        dueDate: "2024-01-18",
        assignee: {
          id: "3",
          name: "Carol Davis",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        labels: ["Backend", "Security"],
        createdAt: "2024-01-09",
        backgroundColor: "#fef3c7",
      },
    ],
  },
  {
    id: "review",
    title: "Review",
    color: "bg-yellow-100",
    cards: [
      {
        id: "4",
        title: "Update documentation",
        description: "Review and update API documentation",
        columnId: "review",
        priority: "low",
        assignee: {
          id: "4",
          name: "David Wilson",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        labels: ["Documentation"],
        createdAt: "2024-01-08",
        backgroundColor: "#e9d5ff",
      },
    ],
  },
  {
    id: "done",
    title: "Done",
    color: "bg-green-100",
    cards: [
      {
        id: "5",
        title: "Database schema design",
        description: "Design and implement the initial database schema",
        columnId: "done",
        priority: "high",
        assignee: {
          id: "2",
          name: "Bob Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        labels: ["Database", "Backend"],
        createdAt: "2024-01-05",
        backgroundColor: "#374151",
      },
    ],
  },
]

const priorityColors = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
}

const labelColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-orange-500"]

function isOverdue(dueDate?: string) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Filter cards based on search and priority
  const filteredColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      cards: column.cards.filter((card) => {
        const matchesSearch =
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesPriority = filterPriority === "all" || card.priority === filterPriority
        return matchesSearch && matchesPriority
      }),
    }))
  }, [columns, searchTerm, filterPriority])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = columns.flatMap((col) => col.cards).find((card) => card.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCardId = active.id as string
    const overColumnId = over.id as string

    setColumns((prevColumns) => {
      const newColumns = [...prevColumns]

      // Find the active card and its current column
      let activeCard: KanbanCard | null = null
      let sourceColumnIndex = -1
      let sourceCardIndex = -1

      for (let i = 0; i < newColumns.length; i++) {
        const cardIndex = newColumns[i].cards.findIndex((card) => card.id === activeCardId)
        if (cardIndex !== -1) {
          activeCard = newColumns[i].cards[cardIndex]
          sourceColumnIndex = i
          sourceCardIndex = cardIndex
          break
        }
      }

      if (!activeCard) return prevColumns

      // Find the target column
      const targetColumnIndex = newColumns.findIndex((col) => col.id === overColumnId)
      if (targetColumnIndex === -1) return prevColumns

      // Remove card from source column
      newColumns[sourceColumnIndex].cards.splice(sourceCardIndex, 1)

      // Add card to target column
      const updatedCard = { ...activeCard, columnId: overColumnId }
      newColumns[targetColumnIndex].cards.push(updatedCard)

      return newColumns
    })
  }

  const addCard = (cardData: Partial<KanbanCard>) => {
    const newCard: KanbanCard = {
      id: Date.now().toString(),
      title: cardData.title || "",
      description: cardData.description || "",
      columnId: selectedColumn,
      priority: cardData.priority || "medium",
      dueDate: cardData.dueDate,
      assignee: cardData.assignee,
      labels: cardData.labels || [],
      createdAt: new Date().toISOString(),
      backgroundColor: cardData.backgroundColor || "#ffffff",
    }

    setColumns((prev) =>
      prev.map((col) => (col.id === selectedColumn ? { ...col, cards: [...col.cards, newCard] } : col)),
    )
    setIsAddCardOpen(false)
  }

  const updateCard = (updatedCard: KanbanCard) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.map((card) => (card.id === updatedCard.id ? updatedCard : card)),
      })),
    )
    setEditingCard(null)
  }

  const deleteCard = (cardId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        cards: col.cards.filter((card) => card.id !== cardId),
      })),
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Project Kanban Board</h1>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddCard={() => {
                  setSelectedColumn(column.id)
                  setIsAddCardOpen(true)
                }}
                onEditCard={setEditingCard}
                onDeleteCard={deleteCard}
              />
            ))}
          </div>

          <DragOverlay>{activeCard ? <KanbanCardComponent card={activeCard} isDragging /> : null}</DragOverlay>
        </DndContext>

        {/* Add Card Dialog */}
        <AddCardDialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen} onAddCard={addCard} />

        {/* Edit Card Dialog */}
        {editingCard && (
          <EditCardDialog card={editingCard} onUpdateCard={updateCard} onClose={() => setEditingCard(null)} />
        )}
      </div>
    </div>
  )
}

// Kanban Column Component
function KanbanColumn({
  column,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  column: Column
  onAddCard: () => void
  onEditCard: (card: KanbanCard) => void
  onDeleteCard: (cardId: string) => void
}) {
  const { setNodeRef } = useSortable({
    id: column.id,
  })

  return (
    <div ref={setNodeRef} className="flex flex-col h-fit">
      <div className={`${column.color} rounded-lg p-4 mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-800">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.cards.length}
          </Badge>
        </div>
        <Button
          onClick={onAddCard}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600 hover:text-slate-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add card
        </Button>
      </div>

      <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {column.cards.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onEdit={() => onEditCard(card)}
              onDelete={() => onDeleteCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// Kanban Card Component
function KanbanCardComponent({
  card,
  isDragging = false,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  isDragging?: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    backgroundColor: card.backgroundColor || "#ffffff",
  }

  const overdue = isOverdue(card.dueDate)
  const textColor = getContrastColor(card.backgroundColor || "#ffffff")

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "rotate-3 shadow-lg" : ""
      } ${overdue ? "border-red-300" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm leading-tight" style={{ color: textColor }}>
            {card.title}
          </h4>
          {onEdit && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" style={{ color: textColor }}>
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {card.description && (
          <p className="text-xs mt-1" style={{ color: textColor, opacity: 0.8 }}>
            {card.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Labels */}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.labels.map((label, index) => (
              <Badge
                key={label}
                variant="secondary"
                className={`text-xs text-white ${labelColors[index % labelColors.length]}`}
              >
                {label}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Priority */}
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priorityColors[card.priority]}`} />
              <span className="text-xs capitalize" style={{ color: textColor, opacity: 0.7 }}>
                {card.priority}
              </span>
            </div>

            {/* Due Date */}
            {card.dueDate && (
              <div
                className={`flex items-center gap-1 ${overdue ? "text-red-600" : ""}`}
                style={{ color: overdue ? "#dc2626" : textColor, opacity: overdue ? 1 : 0.7 }}
              >
                {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                <span className="text-xs">{new Date(card.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Assignee */}
          {card.assignee && (
            <Avatar className="w-6 h-6">
              <AvatarImage src={card.assignee.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {card.assignee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Add Card Dialog
function AddCardDialog({
  open,
  onOpenChange,
  onAddCard,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddCard: (card: Partial<KanbanCard>) => void
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    dueDate: "",
    labels: [] as string[],
    backgroundColor: "#ffffff",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onAddCard(formData)
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      labels: [],
      backgroundColor: "#ffffff",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter card title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter card description..."
              rows={3}
            />
          </div>

          <ColorPicker
            selectedColor={formData.backgroundColor}
            onColorChange={(color) => setFormData({ ...formData, backgroundColor: color })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Card</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit Card Dialog
function EditCardDialog({
  card,
  onUpdateCard,
  onClose,
}: {
  card: KanbanCard
  onUpdateCard: (card: KanbanCard) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    title: card.title,
    description: card.description,
    priority: card.priority,
    dueDate: card.dueDate || "",
    labels: card.labels,
    backgroundColor: card.backgroundColor || "#ffffff",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onUpdateCard({
      ...card,
      ...formData,
      dueDate: formData.dueDate || undefined,
    })
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter card title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter card description..."
              rows={3}
            />
          </div>

          <ColorPicker
            selectedColor={formData.backgroundColor}
            onColorChange={(color) => setFormData({ ...formData, backgroundColor: color })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Card</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
