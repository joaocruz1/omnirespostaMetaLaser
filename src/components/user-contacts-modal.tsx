"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { 
  User, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Users,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Contact {
  id: string
  contactName: string
  phoneNumber: string
  isSavedContact: boolean
  lastMessage: string
  status: "active" | "waiting" | "closed"
  assignedTo: string
  createdAt: string
  updatedAt: string
}

interface UserContactsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

export function UserContactsModal({ isOpen, onClose, userId, userName }: UserContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [totalContacts, setTotalContacts] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "waiting" | "closed">("all")

  const loadUserContacts = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/contacts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts)
        setFilteredContacts(data.contacts)
        setTotalContacts(data.totalContacts)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao carregar contatos")
      }
    } catch (error) {
      console.error("Failed to load user contacts:", error)
      toast.error("Erro ao carregar contatos do usuário")
    } finally {
      setLoading(false)
    }
  }

  const loadDebugData = async () => {
    try {
      const response = await fetch(`/api/debug/chats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Dados de debug:', data)
        toast.success(`Total de chats: ${data.totalChats}`)
      } else {
        const error = await response.json()
        console.error('Erro debug:', error)
        toast.error("Erro ao carregar dados de debug")
      }
    } catch (error) {
      console.error("Failed to load debug data:", error)
      toast.error("Erro ao carregar dados de debug")
    }
  }

  useEffect(() => {
    if (isOpen && userId) {
      loadUserContacts()
    }
  }, [isOpen, userId])

  // Filtrar contatos baseado na busca e status
  useEffect(() => {
    let filtered = contacts

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber.includes(searchTerm) ||
        contact.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter(contact => contact.status === statusFilter)
    }

    setFilteredContacts(filtered)
  }, [contacts, searchTerm, statusFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "waiting":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "closed":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo"
      case "waiting":
        return "Aguardando"
      case "closed":
        return "Finalizado"
      default:
        return "Desconhecido"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const activeContacts = contacts.filter(c => c.status === "active").length
  const waitingContacts = contacts.filter(c => c.status === "waiting").length
  const closedContacts = contacts.filter(c => c.status === "closed").length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-purple-200/30 dark:border-purple-800/30">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span>Contatos de {userName}</span>
              </DialogTitle>
              <DialogDescription>
                Lista de todos os contatos vinculados a este usuário ({totalContacts} total)
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Resumo */}
          <div className="flex-shrink-0 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-purple-200/30 dark:border-purple-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{userName}</p>
                  <p className="text-sm text-muted-foreground">
                    {totalContacts} contato{totalContacts !== 1 ? 's' : ''} vinculado{totalContacts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {activeContacts} ativos
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                  {waitingContacts} aguardando
                </Badge>
                <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {closedContacts} finalizados
                </Badge>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex-shrink-0 p-4 border-b border-purple-200/30 dark:border-purple-800/30">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="waiting">Aguardando</SelectItem>
                  <SelectItem value="closed">Finalizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conteúdo Principal com Scroll */}
          <div className="flex-1 min-h-0 p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
                <span className="ml-2 text-muted-foreground">Carregando contatos...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" 
                    ? "Nenhum contato encontrado com os filtros aplicados" 
                    : "Nenhum contato vinculado a este usuário"
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full w-full">
                <div className="space-y-3 pr-4">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 border border-purple-200/30 dark:border-purple-800/30 rounded-xl bg-white/40 dark:bg-gray-800/40 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">
                                {contact.contactName}
                              </p>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{contact.phoneNumber}</span>
                                </div>
                                {contact.isSavedContact && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-green-300 text-green-600 dark:border-green-700 dark:text-green-400 flex-shrink-0">
                                    Salvo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground truncate">
                                {contact.lastMessage}
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span>Criado: {formatDate(contact.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>Atualizado: {formatDate(contact.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
                          <Badge className={cn("text-xs", getStatusColor(contact.status))}>
                            {getStatusText(contact.status)}
                          </Badge>
                          
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            {contact.status === "active" ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : contact.status === "waiting" ? (
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-gray-500" />
                            )}
                            <span className="truncate">{contact.assignedTo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-purple-200/30 dark:border-purple-800/30 bg-white/50 dark:bg-gray-900/50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Mostrando {filteredContacts.length} de {totalContacts} contatos
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={loadDebugData}>
                  Debug
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button 
                  onClick={loadUserContacts}
                  disabled={loading}
                  className="gradient-purple hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Atualizar Lista
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
