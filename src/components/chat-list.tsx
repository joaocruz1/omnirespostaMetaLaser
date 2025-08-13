"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, RefreshCw, User, MessageCircle, Plus, Save, Edit, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"

interface Chat {
  id: string
  contact: string
  lastMessage: any
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
  profilePicUrl?: string
  isSavedContact?: boolean
}

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
  onRefresh: () => void
  unreadChats: Map<string, number>
  isLoading?: boolean
}

export function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  onRefresh,
  unreadChats,
  isLoading = false,
}: ChatListProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "waiting" | "closed">("all")
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "my" | "unassigned">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaveContactDialogOpen, setIsSaveContactDialogOpen] = useState(false)
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [newContact, setNewContact] = useState({ contact: "", name: "", assignedTo: "" })
  const [contactToSave, setContactToSave] = useState<{ chat: Chat | null; name: string }>({ chat: null, name: "" })
  const [contactToEdit, setContactToEdit] = useState<{ chat: Chat | null; name: string }>({ chat: null, name: "" })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (err) {
        console.error("Failed to load users", err)
      }
    }
    loadUsers()
  }, [])

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: newContact.contact,
          contact: newContact.contact,
          assignedTo: newContact.assignedTo,
        }),
      })
      if (res.ok) {
        toast.success("Contato adicionado")
        setIsDialogOpen(false)
        setNewContact({ contact: "", name: "", assignedTo: "" })
        onRefresh()
      } else {
        toast.error("Falha ao adicionar contato")
      }
    } catch (err) {
      console.error("Failed to add contact", err)
      toast.error("Falha ao adicionar contato")
    }
  }

  const handleSaveContact = (chat: Chat) => {
    // Extrair o nome do contato (remover "- Não Salvo" se presente)
    const contactName = chat.contact.replace(" - Não Salvo", "").trim()
    setContactToSave({ chat, name: contactName })
    setIsSaveContactDialogOpen(true)
  }

  const handleConfirmSaveContact = async () => {
    if (!contactToSave.chat) return

    try {
      // Extrair o número do telefone do ID do chat
      const phoneNumber = contactToSave.chat.id.split('@')[0]
      
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: phoneNumber,
          name: contactToSave.name,
        }),
      })
      
      if (res.ok) {
        toast.success("Contato salvo com sucesso!")
        setIsSaveContactDialogOpen(false)
        setContactToSave({ chat: null, name: "" })
        onRefresh()
      } else {
        toast.error("Falha ao salvar contato")
      }
    } catch (err) {
      console.error("Failed to save contact", err)
      toast.error("Falha ao salvar contato")
    }
  }

  const handleEditContact = (chat: Chat) => {
    // Para contatos salvos, usar o nome atual
    const contactName = chat.contact
    setContactToEdit({ chat, name: contactName })
    setIsEditContactDialogOpen(true)
  }

  const handleConfirmEditContact = async () => {
    if (!contactToEdit.chat) return

    try {
      // Extrair o número do telefone do ID do chat
      const phoneNumber = contactToEdit.chat.id.split('@')[0]
      
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: phoneNumber,
          name: contactToEdit.name,
        }),
      })
      
      if (res.ok) {
        toast.success("Contato atualizado com sucesso!")
        setIsEditContactDialogOpen(false)
        setContactToEdit({ chat: null, name: "" })
        onRefresh()
      } else {
        toast.error("Falha ao atualizar contato")
      }
    } catch (err) {
      console.error("Failed to update contact", err)
      toast.error("Falha ao atualizar contato")
    }
  }

  const filteredChats = chats.filter((chat) => {
    const contactMatch =
      typeof chat.contact === "string" && chat.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const messageMatch =
      typeof chat.lastMessage === "string" && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSearch = contactMatch || messageMatch
    const matchesFilter = filter === "all" || chat.status === filter
    
    // Filtro por atribuição
    let matchesAssignment = true
    if (assignmentFilter === "my") {
      // Mostrar apenas chats atribuídos ao usuário atual
      matchesAssignment = chat.assignedTo === user?.name
    } else if (assignmentFilter === "unassigned") {
      // Mostrar apenas chats não atribuídos ou atribuídos ao Agente IA
      matchesAssignment = !chat.assignedTo || chat.assignedTo === "Agente IA"
    }
    
    return matchesSearch && matchesFilter && matchesAssignment
  })

  return (
    <Card className="h-full flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-0 shadow-xl theme-smooth">
      <CardHeader className="flex-shrink-0 pb-4 px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Conversas
            </span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent rounded-lg"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-purple-600" />
                    <span>Novo Contato</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-medium">Número do contato</Label>
                    <Input
                      id="contact"
                      value={newContact.contact}
                      onChange={(e) => setNewContact({ ...newContact, contact: e.target.value })}
                      required
                      className="border-gray-200 dark:border-gray-700 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-name" className="text-sm font-medium">Nome do contato</Label>
                    <Input
                      id="contact-name"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      required
                      className="border-gray-200 dark:border-gray-700 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo" className="text-sm font-medium">Designar para</Label>
                    <Select
                      value={newContact.assignedTo}
                      onValueChange={(v) => setNewContact({ ...newContact, assignedTo: v })}
                    >
                      <SelectTrigger className="border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.name}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                    Adicionar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog para salvar contato */}
            <Dialog open={isSaveContactDialogOpen} onOpenChange={setIsSaveContactDialogOpen}>
              <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Save className="h-5 w-5 text-purple-600" />
                    <span>Salvar Contato</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleConfirmSaveContact(); }}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName" className="text-sm font-medium">Nome do Contato</Label>
                      <Input
                        id="contactName"
                        value={contactToSave.name}
                        onChange={(e) => setContactToSave({ ...contactToSave, name: e.target.value })}
                        placeholder="Digite o nome do contato"
                        required
                        className="border-gray-200 dark:border-gray-700 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsSaveContactDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                        Salvar
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog para editar contato */}
            <Dialog open={isEditContactDialogOpen} onOpenChange={setIsEditContactDialogOpen}>
              <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Edit className="h-5 w-5 text-purple-600" />
                    <span>Editar Contato</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleConfirmEditContact(); }}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="editContactName" className="text-sm font-medium">Nome do Contato</Label>
                      <Input
                        id="editContactName"
                        value={contactToEdit.name}
                        onChange={(e) => setContactToEdit({ ...contactToEdit, name: e.target.value })}
                        placeholder="Digite o nome do contato"
                        required
                        className="border-gray-200 dark:border-gray-700 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditContactDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                        Atualizar
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent rounded-lg"
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 text-sm bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 rounded-lg"
            />
          </div>
          <div className="flex space-x-1">
            <Button
              variant={assignmentFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssignmentFilter("all")}
              className={cn(
                "h-8 px-3 text-xs font-medium rounded-lg transition-all duration-200",
                assignmentFilter === "all"
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
              )}
            >
              <Filter className="h-3 w-3 mr-1" />
              Todas
            </Button>
            <Button
              variant={assignmentFilter === "my" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssignmentFilter("my")}
              className={cn(
                "h-8 px-3 text-xs font-medium rounded-lg transition-all duration-200",
                assignmentFilter === "my"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                  : "border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/50",
              )}
            >
              <User className="h-3 w-3 mr-1" />
              Minhas
            </Button>
            <Button
              variant={assignmentFilter === "unassigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setAssignmentFilter("unassigned")}
              className={cn(
                "h-8 px-3 text-xs font-medium rounded-lg transition-all duration-200",
                assignmentFilter === "unassigned"
                  ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md"
                  : "border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/50",
              )}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              IA
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full scrollbar-thin">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
              <p className="text-xs mt-1">Tente ajustar os filtros ou adicionar um novo contato</p>
            </div>
          ) : (
            <div className="space-y-1 p-3">
              {filteredChats.map((chat) => {
                const newMessagesCount = unreadChats.get(chat.id)
                return (
                  <div
                    key={chat.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-200 border border-transparent rounded-xl relative group",
                      selectedChat?.id === chat.id
                        ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700",
                      newMessagesCount && newMessagesCount > 0 && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                    )}
                    onClick={() => onSelectChat(chat)}
                  >
                    {/* Indicador de mensagem não lida */}
                    {newMessagesCount && newMessagesCount > 0 && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-sm" />
                    )}
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {chat.profilePicUrl ? (
                          <img
                            src={chat.profilePicUrl || "/placeholder.svg"}
                            alt="Foto de Perfil"
                            className="w-12 h-12 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className={cn(
                              "font-semibold text-sm truncate",
                              chat.isSavedContact === false 
                                ? "text-orange-600 dark:text-orange-400" 
                                : "text-gray-900 dark:text-gray-100"
                            )}>
                              {chat.contact}
                            </p>
                            {chat.isSavedContact === false && (
                              <Badge variant="outline" className="text-xs px-2 py-0 h-5 border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30">
                                Não Salvo
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{chat.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={cn(
                            "text-sm truncate flex-1",
                            newMessagesCount && newMessagesCount > 0
                              ? "text-blue-600 dark:text-blue-400 font-semibold"
                              : "text-gray-600 dark:text-gray-400"
                          )}>
                            {typeof chat.lastMessage === "string" ? chat.lastMessage : "[Mídia]"}
                          </p>
                          {newMessagesCount && newMessagesCount > 0 ? (
                            <Badge
                              variant="destructive"
                              className="ml-2 flex-shrink-0 text-xs px-2 py-0 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold"
                            >
                              {newMessagesCount}
                            </Badge>
                          ) : (
                            chat.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-2 flex-shrink-0 text-xs px-2 py-0 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold"
                              >
                                {chat.unreadCount}
                              </Badge>
                            )
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            {chat.assignedTo && (
                              <Badge
                                variant="outline"
                                className="text-xs px-2 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800 font-medium"
                              >
                                <User className="h-3 w-3 mr-1" />
                                {chat.assignedTo}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs px-2 py-0 h-5 font-medium",
                                chat.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                                  : chat.status === "waiting"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800"
                                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                              )}
                            >
                              {chat.status === "active" ? "Ativo" : chat.status === "waiting" ? "Aguardando" : "Finalizado"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {chat.isSavedContact === false && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveContact(chat)
                                }}
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-950/50 rounded-md"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                            )}
                            {chat.isSavedContact === true && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditContact(chat)
                                }}
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/50 rounded-md"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
