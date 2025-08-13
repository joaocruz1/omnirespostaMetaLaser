"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import {
  Send,
  Paperclip,
  UserCheck,
  MoreVertical,
  Archive,
  UserX,
  MessageSquare,
  User,
  Circle,
  Loader2,
  ChevronDown,
  MapPin,
  ExternalLink,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  Bot,
  BotOff,
  Volume2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn, notify } from "@/lib/utils"
import { MessageMedia } from "./message-media"
import { ImageViewer } from "./image-viewer"
import { ContactInfoModal } from "./contact-info-modal"
import Pusher from "pusher-js"

interface Chat {
  id: string
  contact: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
  profilePicUrl?: string
  isSavedContact?: boolean
}

interface Message {
  id: string
  content: string
  type: "text" | "image" | "audio" | "document" | "location" | "video"
  sender: "user" | "agent" | "customer"
  timestamp: string
  hasMedia?: boolean
  mediaUrl?: string
  status?: "ERROR" | "PENDING" | "SERVER_ACK" | "DELIVERY_ACK" | "READ" | "PLAYED"
}

interface ChatWindowProps {
  chat: Chat | null
  onChatUpdate: () => void
  onUpdateSelectedChat?: () => void
  lastPusherEvent: any
}

export function ChatWindow({ chat, onChatUpdate, onUpdateSelectedChat, lastPusherEvent }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; caption?: string } | null>(null)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const { user } = useAuth()

  const [isAiEnabled, setIsAiEnabled] = useState(true)

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  // Estado para controlar notificações duplicadas
  const [lastNotification, setLastNotification] = useState<{ type: string; message: string; timestamp: number } | null>(null)
  // Estado para controlar transferências automáticas
  const [lastAutoTransfer, setLastAutoTransfer] = useState<number>(0)

  // Função para mostrar toast evitando duplicatas
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const now = Date.now()
    const last = lastNotification
    
    // Evitar notificações duplicadas dentro de 2 segundos
    if (last && last.type === type && last.message === message && (now - last.timestamp) < 2000) {
      return
    }
    
    setLastNotification({ type, message, timestamp: now })
    
    switch (type) {
      case 'success':
        toast.success(message)
        break
      case 'error':
        toast.error(message)
        break
      case 'info':
        toast.info(message)
        break
    }
  }

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (!isAiEnabled) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsAiEnabled(true)
        showToast('info', "Agente IA reativado automaticamente após 30 minutos. Transferindo conversa...")
        // Transferir conversa de volta para Agente IA quando reativar automaticamente
        transferChatToAI()
      }, 30 * 60 * 1000) // 30 minutos
    }
  }

  const transferChatToUser = async () => {
    if (!chat || !user) return

    // Verificar se o chat já está atribuído ao usuário atual
    if (chat.assignedTo === user.name) {
      showToast('info', "Esta conversa já está atribuída a você")
      return
    }

    try {
      const response = await fetch(`/api/chats/${chat.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        showToast('success', "Conversa transferida para você com sucesso!")
        // Atualizar apenas o chat selecionado para evitar recarregar todo o componente
        if (onUpdateSelectedChat) {
          onUpdateSelectedChat()
        }
      } else {
        const error = await response.json()
        showToast('error', error.error || "Erro ao transferir conversa")
      }
    } catch (error) {
      console.error("Failed to transfer chat:", error)
      showToast('error', "Erro ao transferir conversa")
    }
  }

  const transferChatToAI = async () => {
    if (!chat) return

    // Verificar se o chat já está atribuído ao Agente IA
    if (chat.assignedTo === "Agente IA") {
      return
    }

    try {
      const response = await fetch(`/api/chats/${chat.id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId: null }), // null indica transferência para Agente IA
      })

      if (response.ok) {
        showToast('success', "Conversa transferida para Agente IA com sucesso!")
        // Atualizar apenas o chat selecionado para evitar recarregar todo o componente
        if (onUpdateSelectedChat) {
          onUpdateSelectedChat()
        }
      } else {
        const error = await response.json()
        showToast('error', error.error || "Erro ao transferir conversa para Agente IA")
      }
    } catch (error) {
      console.error("Failed to transfer chat to AI:", error)
      showToast('error', "Erro ao transferir conversa para Agente IA")
    }
  }

  const loadMessages = async (pageNum = 1, append = false) => {
    if (!chat || messagesLoading) return

    setMessagesLoading(true)

    try {
      const response = await fetch(`/api/chats/${chat.id}/messages?page=${pageNum}&limit=50`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (append) {
          setMessages((prev) => [...data.messages, ...prev])
        } else {
          setMessages(data.messages || [])
          setShouldScrollToBottom(true)
        }

        setHasMore(data.hasMore || false)
        setPage(pageNum)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
      showToast('error', "Erro ao carregar mensagens")
    } finally {
      setMessagesLoading(false)
    }
  }

  const loadMoreMessages = () => {
    if (hasMore && !messagesLoading) {
      loadMessages(page + 1, true)
    }
  }

  useEffect(() => {
    if (chat) {
      // Se a conversa está atribuída ao Agente IA, mostrar como IA Ativa
      if (chat.assignedTo === "Agente IA") {
        setIsAiEnabled(true)
      } else {
        // Se a conversa está atribuída a um usuário, mostrar como IA Inativa
        setIsAiEnabled(false)
      }
    }
  }, [chat])

  useEffect(() => {
    if (chat) {
      // Não salvar no localStorage, pois agora o estado é baseado apenas no assignedTo
      // localStorage.setItem(`ai-enabled-${chat.id}`, String(isAiEnabled))
    }
    if (isAiEnabled) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
        inactivityTimerRef.current = null
      }
    } else {
      resetInactivityTimer()
    }
  }, [isAiEnabled, chat])

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
    }
  }, [chat?.id]) // Limpar timer quando o chat mudar

  // Manter foco no textarea quando o componente montar
  useEffect(() => {
    if (chat && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [chat?.id])

  // Atualizar status da mensagem com Pusher
  useEffect(() => {
    if (!chat) return

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    const channel = pusher.subscribe('chat-updates')

    const handleStatusUpdate = (data: { id: string; status: Message['status'] }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.id ? { ...msg, status: data.status } : msg
        )
      )
    }

    channel.bind('message-status-update', handleStatusUpdate)

    return () => {
      channel.unbind('message-status-update', handleStatusUpdate)
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [chat])

  // Função para renderizar o ícone de status
  const MessageStatus = ({ status }: { status: Message['status'] }) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 ml-1 text-gray-400" />
      case "SERVER_ACK":
        return <Check className="h-4 w-4 ml-1 text-gray-400" />
      case "DELIVERY_ACK":
        return <CheckCheck className="h-4 w-4 ml-1 text-gray-500" />
      case "READ":
      case "PLAYED":
        return <CheckCheck className="h-4 w-4 ml-1 text-blue-500" />
      case "ERROR":
        return <AlertCircle className="h-4 w-4 ml-1 text-red-500" />
      default:
        return null
    }
  }

  useEffect(() => {
    if (chat) {
      setMessages([])
      setPage(1)
      setHasMore(true)
      loadMessages(1, false)
      loadUsers()
      // Limpar estados de controle quando trocar de chat
      setLastNotification(null)
      setLastAutoTransfer(0)
      // Manter o foco no textarea quando trocar de chat
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 200)
    } else {
      setMessages([])
    }
  }, [chat?.id]) // Usar apenas o ID do chat para evitar recarregamentos desnecessários

  // Atualizar mensagens quando receber eventos do Pusher
  useEffect(() => {
    if (chat && lastPusherEvent) {
      // Em vez de recarregar todas as mensagens, apenas adicionar a nova mensagem
      // Isso evita o reload completo da janela
      const newMessage = lastPusherEvent.message
      if (newMessage && newMessage.chatId === chat.id) {
        // Verificar se a mensagem já existe para evitar duplicatas
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage.id)
          if (messageExists) {
            return prev
          }
          return [...prev, newMessage]
        })
        setShouldScrollToBottom(true)
      }
    }
  }, [lastPusherEvent, chat])

  useEffect(() => {
    if (shouldScrollToBottom && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
        setShouldScrollToBottom(false)
      }
    }
  }, [messages, shouldScrollToBottom])

  const scrollToBottom = () => {
    setShouldScrollToBottom(true)
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const sendMessage = async (file?: File) => {
    if ((!newMessage.trim() && !file) || !chat || loading) return

    // Verificar se o chat está atribuído ao Agente IA e transferir automaticamente
    const now = Date.now()
    if (chat.assignedTo === "Agente IA" && user && (now - lastAutoTransfer) > 5000) {
      setLastAutoTransfer(now)
      try {
        const response = await fetch(`/api/chats/${chat.id}/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ userId: user.id }),
        })

        if (response.ok) {
          // Aguardar um pouco para o evento Pusher ser processado
          setTimeout(() => {
            if (onUpdateSelectedChat) {
              onUpdateSelectedChat()
            }
          }, 500)
        } else {
          console.error("Erro ao transferir conversa automaticamente")
        }
      } catch (error) {
        console.error("Failed to auto-transfer chat:", error)
      }
    }

    resetInactivityTimer()
    setLoading(true)
    const optimisticId = `temp-${Date.now()}`
    const messageText = newMessage
    // Não limpar o input imediatamente para manter o foco
    // setNewMessage("")

    let optimisticMessage: Message

    if (file) {
      optimisticMessage = {
        id: optimisticId,
        content: messageText || file.name,
        sender: "agent",
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.type.startsWith("video/")
              ? "video"
              : file.type.includes("location") || file.name.includes("location")
                ? "location"
                : "document",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        mediaUrl: URL.createObjectURL(file),
        hasMedia: true,
        status: "PENDING",
      }
    } else {
      optimisticMessage = {
        id: optimisticId,
        content: messageText,
        sender: "agent",
        type: "text",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        hasMedia: false,
        status: "PENDING",
      }
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setShouldScrollToBottom(true)

    try {
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
        formData.append("caption", messageText)
      }

      const endpoint = file ? `/api/messages/${chat.id}/send-media` : `/api/messages/${chat.id}/send`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(!file && { "Content-Type": "application/json" }),
        },
        body: file ? formData : JSON.stringify({ message: messageText }),
      })

      const responseData = await response.json()

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId
              ? { ...msg, id: responseData.data.key.id, status: "SERVER_ACK" }
              : msg,
          ),
        )
        // Limpar o input apenas após o sucesso
        setNewMessage("")
        // Atualizar apenas a lista de chats sem recarregar a janela
        if (onUpdateSelectedChat) {
          onUpdateSelectedChat()
        }
      } else {
        throw new Error(responseData.error || "Falha ao enviar mensagem.")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      showToast('error', `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      // Em caso de erro, restaurar o texto da mensagem
      setNewMessage(messageText)
    } finally {
      setLoading(false)
      if (file && optimisticMessage.mediaUrl) {
        URL.revokeObjectURL(optimisticMessage.mediaUrl)
      }
      // Manter o foco no textarea após enviar
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      sendMessage(file)
    }
    if (event.target) {
      event.target.value = ""
    }
  }

  const handleImageClick = (src: string, alt: string, caption?: string) => {
    setSelectedImage({ src, alt, caption })
    setShowImageViewer(true)
  }

  const transferChat = async (userId: string) => {
    if (!chat) return
    
    // Buscar o nome do usuário para mostrar na mensagem
    const user = users.find(u => u.id === userId)
    const userName = user ? user.name : "usuário"
    
    try {
      const response = await fetch(`/api/chats/${chat.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId }),
      })
      
      if (response.ok) {
        // Atualizar apenas o chat selecionado para evitar recarregar todo o componente
        if (onUpdateSelectedChat) {
          onUpdateSelectedChat()
        }
        
        showToast('success', `Conversa transferida para ${userName}`)
      } else {
        const errorData = await response.json()
        showToast('error', errorData.error || "Erro ao transferir conversa")
      }
    } catch (error) {
      console.error("Failed to transfer chat:", error)
      showToast('error', "Erro ao transferir conversa")
    }
  }

  const updateChatStatus = async (status: "active" | "waiting" | "closed") => {
    if (!chat) return
    try {
      const response = await fetch(`/api/chats/${chat.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      })
      
      if (response.ok) {
        // Atualizar apenas o chat selecionado para evitar recarregar todo o componente
        if (onUpdateSelectedChat) {
          onUpdateSelectedChat()
        }
        
        const statusText = getStatusText(status)
        showToast('success', `Status alterado para ${statusText}`)
      } else {
        const errorData = await response.json()
        showToast('error', errorData.error || "Erro ao atualizar status")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      showToast('error', "Erro ao atualizar status")
    }
  }

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

  const getContactInfo = () => {
    if (!chat) return null

    const phoneNumber = chat.id.split('@')[0]
    const contactName = chat.isSavedContact === true 
      ? chat.contact 
      : chat.contact.replace(" - Não Salvo", "")

    return {
      id: chat.id,
      name: contactName,
      phoneNumber: phoneNumber,
      isSaved: chat.isSavedContact === true,
      profilePicUrl: chat.profilePicUrl,
      createdAt: undefined // Seria necessário buscar do banco se quiser mostrar
    }
  }

  if (!chat) {
    return (
      <Card className="h-full flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 gradient-purple-light rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-base font-semibold mb-1">Selecione uma conversa</h3>
            <p className="text-sm">Escolha uma conversa da lista para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-sm">
      <CardHeader className="flex-shrink-0 border-b border-purple-200/30 dark:border-purple-800/30 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/30 dark:to-pink-950/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 gradient-purple rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowContactInfo(true)}
            >
              {chat.profilePicUrl ? (
                <img
                  src={chat.profilePicUrl || "/placeholder.svg"}
                  alt="Foto de Perfil"
                  className="w-10 h-10 rounded-lg object-cover"
                  loading="lazy"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle 
                  className="text-base font-semibold cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  onClick={() => setShowContactInfo(true)}
                >
                  {chat.isSavedContact === true 
                    ? chat.contact 
                    : chat.contact.replace(" - Não Salvo", "")
                  }
                </CardTitle>
                {chat.isSavedContact === false && (
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4 border-orange-300 text-orange-600 dark:border-orange-700 dark:text-orange-400">
                    Não Salvo
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {chat.id.split('@')[0]}
                </span>
                <Badge variant="outline" className={cn("text-xs px-2 py-0 h-5", getStatusColor(chat.status))}>
                  <Circle
                    className={cn(
                      "w-1.5 h-1.5 fill-current mr-1",
                      chat.status === "active"
                        ? "text-green-500"
                        : chat.status === "waiting"
                          ? "text-yellow-500"
                          : "text-gray-400",
                    )}
                  />
                  {getStatusText(chat.status)}
                </Badge>
              </div>
              {chat.assignedTo && (
                <div className="flex items-center space-x-1 mt-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-0 h-5",
                      chat.assignedTo === "Agente IA"
                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800"
                        : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
                    )}
                  >
                    <User className="h-3 w-3 mr-1" />
                    Responsável: {chat.assignedTo}
                    {chat.assignedTo === "Agente IA" && (
                      <span className="ml-1 text-xs">(Envie uma mensagem para assumir)</span>
                    )}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select onValueChange={transferChat}>
              <SelectTrigger className="w-32 h-8 text-xs border-purple-200 dark:border-purple-800">
                <SelectValue placeholder="Transferir" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const next = !isAiEnabled
                setIsAiEnabled(next)
                if (next) {
                  showToast('success', "Agente IA ativado. Transferindo conversa para Agente IA...")
                  // Transferir conversa de volta para Agente IA quando reativada
                  await transferChatToAI()
                } else {
                  showToast('info', "Agente IA desativado. Transferindo conversa para você...")
                  // Transferir conversa para o usuário logado quando IA for desativada
                  await transferChatToUser()
                }
              }}
              className={cn(
                "h-8 px-2",
                isAiEnabled
                  ? "border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
                  : "bg-red-500 text-white border-red-500 hover:bg-red-600",
              )}
            >
              {isAiEnabled ? (
                <Bot className="h-3 w-3 mr-1" />
              ) : (
                <BotOff className="h-3 w-3 mr-1" />
              )}
              {isAiEnabled ? "IA Ativa" : "IA Inativa"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateChatStatus("active")} className="text-xs">
                  <UserCheck className="h-3 w-3 mr-2" />
                  Marcar como Ativo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateChatStatus("waiting")} className="text-xs">
                  <UserX className="h-3 w-3 mr-2" />
                  Marcar como Aguardando
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateChatStatus("closed")} className="text-xs">
                  <Archive className="h-3 w-3 mr-2" />
                  Finalizar Conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full scrollbar-thin">
            <div className="p-4 space-y-3">
              {/* Mensagem informativa quando chat está atribuído ao Agente IA */}
              {chat.assignedTo === "Agente IA" && (
                <div className="text-center">
                  <div className="inline-flex items-center space-x-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-2 text-sm text-orange-700 dark:text-orange-300">
                    <Bot className="h-4 w-4" />
                    <span>Esta conversa está sendo atendida pelo Agente IA. Envie uma mensagem para assumir o atendimento.</span>
                  </div>
                </div>
              )}

              {/* Botão para carregar mensagens anteriores */}
              {hasMore && (
                <div className="text-center">
                  <Button
                    onClick={loadMoreMessages}
                    disabled={messagesLoading}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent"
                  >
                    {messagesLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      "Carregar mensagens anteriores"
                    )}
                  </Button>
                </div>
              )}

              {/* Lista de mensagens otimizada */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-3 py-2 rounded-2xl shadow-sm text-sm relative",
                      message.sender === "agent"
                        ? "gradient-purple text-white shadow-purple/20 rounded-br-none"
                        : "bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50 rounded-bl-none",
                    )}
                  >
                    {/* Renderização otimizada de mídia */}
                    {message.hasMedia && message.type !== "text" ? (
                      <div className="mb-2">
                        {message.mediaUrl ? (
                          // Mídia já carregada (mensagem otimista)
                          <>
                            {message.type === "image" && (
                              <img
                                src={message.mediaUrl || "/placeholder.svg"}
                                alt={message.content || "Imagem"}
                                className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() =>
                                  handleImageClick(message.mediaUrl!, message.content || "Imagem", message.content)
                                }
                              />
                            )}
                            {message.type === "audio" && (
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-w-xs">
                                <audio src={message.mediaUrl} preload="metadata" />
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                    <Volume2 className="h-5 w-5 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {message.content || "Mensagem de áudio"}
                                    </p>
                                    <p className="text-xs text-gray-500">Carregando...</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {message.type === "video" && (
                              <video src={message.mediaUrl} controls className="w-full max-h-64 rounded-lg" />
                            )}
                            {message.type === "location" && (
                              <div className="flex items-center gap-2 p-2 bg-black/10 rounded-md">
                                <MapPin className="h-4 w-4" />
                                <span>Localização compartilhada</span>
                                {message.mediaUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(message.mediaUrl, "_blank")}
                                    className="p-0 h-auto ml-auto"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                            {message.type === "document" && (
                              <a
                                href={message.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={message.content || "documento"}
                                className="flex items-center gap-2 p-2 bg-black/10 rounded-md hover:bg-black/20 transition-colors"
                              >
                                <Paperclip className="h-4 w-4" />
                                <span className="underline">{message.content || "Baixar Documento"}</span>
                              </a>
                            )}
                          </>
                        ) : (
                          // Lazy loading de mídia
                          <MessageMedia
                            messageId={message.id}
                            chatId={chat.id}
                            type={message.type}
                            content={message.content}
                          />
                        )}
                      </div>
                    ) : null}

                    {/* Conteúdo da mensagem */}
                    {message.content && message.type === "text" && (
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}

                    {/* Timestamp e Status */}
                    <div className="flex items-center justify-end">
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.sender === "agent" ? "text-purple-100" : "text-muted-foreground",
                        )}
                      >
                        {message.timestamp}
                      </p>
                      {message.sender === "agent" && <MessageStatus status={message.status} />}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading inicial */}
              {messagesLoading && page === 1 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Botão para scroll para baixo */}
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 rounded-full w-10 h-10 p-0 shadow-lg z-10"
          variant="secondary"
          size="sm"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Área de input */}
        <div className="border-t border-purple-200/30 dark:border-purple-800/30 p-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              sendMessage()
            }}
            className="flex items-end space-x-2"
          >
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.stopPropagation()
                    sendMessage()
                  }
                }}
                className="min-h-[40px] max-h-24 resize-none text-sm bg-white dark:bg-gray-800 border border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600 rounded-full px-4 py-2"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="flex space-x-1">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  sendMessage()
                }}
                disabled={loading || !newMessage.trim()}
                size="sm"
                className="h-8 w-8 p-0 rounded-full gradient-purple hover:opacity-90 shadow-sm"
                type="button"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                disabled={loading}
                type="button"
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>
          </form>
        </div>

        {/* Image Viewer Modal */}
        {selectedImage && (
          <ImageViewer
            src={selectedImage.src || "/placeholder.svg"}
            alt={selectedImage.alt}
            caption={selectedImage.caption}
            isOpen={showImageViewer}
            onClose={() => {
              setShowImageViewer(false)
              setSelectedImage(null)
            }}
          />
        )}

        {/* Contact Info Modal */}
        <ContactInfoModal
          contact={getContactInfo()}
          isOpen={showContactInfo}
          onClose={() => setShowContactInfo(false)}
          onUpdate={onChatUpdate}
        />
      </CardContent>
    </Card>
  )
}