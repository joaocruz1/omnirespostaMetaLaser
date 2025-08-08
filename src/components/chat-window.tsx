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
  Bot,
  BotOff,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MessageMedia } from "./message-media"
import { ImageViewer } from "./image-viewer"
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
  lastPusherEvent: any
}

export function ChatWindow({ chat, onChatUpdate, lastPusherEvent }: ChatWindowProps) {
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
  const { user } = useAuth()

  const [isAiEnabled, setIsAiEnabled] = useState(true)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
    }
    if (!isAiEnabled) {
      inactivityTimerRef.current = setTimeout(() => {
        setIsAiEnabled(true)
        toast.info("Agente IA reativado após 20 minutos de inatividade.")
      }, 20 * 60 * 1000)
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
      toast.error("Erro ao carregar mensagens")
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
      const stored = localStorage.getItem(`ai-enabled-${chat.id}`)
      setIsAiEnabled(stored !== "false")
    }
  }, [chat])

  useEffect(() => {
    if (chat) {
      localStorage.setItem(`ai-enabled-${chat.id}`, String(isAiEnabled))
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
  }, [])

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
    if (!status) return null

    let color = "text-gray-400"
    if (status === "READ" || status === "PLAYED") {
      color = "text-blue-500"
    } else if (status === "DELIVERY_ACK") {
      color = "text-gray-500"
    }

    return <CheckCheck className={`h-4 w-4 ml-1 ${color}`} />
  }

  useEffect(() => {
    if (chat) {
      setMessages([])
      setPage(1)
      setHasMore(true)
      loadMessages(1, false)
      loadUsers()
    } else {
      setMessages([])
    }
  }, [chat])

  // Atualizar mensagens quando receber eventos do Pusher
  useEffect(() => {
    if (chat && lastPusherEvent) {
      loadMessages(1, false)
    }
  }, [lastPusherEvent])

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

    resetInactivityTimer()
    setLoading(true)
    const optimisticId = `temp-${Date.now()}`

    let optimisticMessage: Message

    if (file) {
      optimisticMessage = {
        id: optimisticId,
        content: `Enviando ${file.name}...`,
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
        content: newMessage,
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
        formData.append("caption", newMessage)
      }

      const endpoint = file ? `/api/messages/${chat.id}/send-media` : `/api/messages/${chat.id}/send`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(!file && { "Content-Type": "application/json" }),
        },
        body: file ? formData : JSON.stringify({ message: optimisticMessage.content }),
      })

      const responseData = await response.json()

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === optimisticId ? { ...msg, id: responseData.data.key.id } : msg)),
        )
        onChatUpdate()
      } else {
        throw new Error(responseData.error || "Falha ao enviar mensagem.")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error(`Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      if (!file) setNewMessage(optimisticMessage.content)
    } finally {
      setLoading(false)
      if (file && optimisticMessage.mediaUrl) {
        URL.revokeObjectURL(optimisticMessage.mediaUrl)
      }
      textareaRef.current?.focus()
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
        onChatUpdate()
        toast.success("Conversa transferida com sucesso")
      }
    } catch (error) {
      console.error("Failed to transfer chat:", error)
      toast.error("Erro ao transferir conversa")
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
        onChatUpdate()
        toast.success("Status atualizado com sucesso")
      }
    } catch (error) {
      console.error("Failed to update status:", error)
      toast.error("Erro ao atualizar status")
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
            <div className="w-10 h-10 gradient-purple rounded-lg flex items-center justify-center shadow-sm">
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
              <CardTitle className="text-base font-semibold">{chat.contact}</CardTitle>
              <div className="flex items-center space-x-2 mt-0.5">
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
                {chat.assignedTo && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800"
                  >
                    {chat.assignedTo}
                  </Badge>
                )}
              </div>
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
              onClick={() => {
                const next = !isAiEnabled
                setIsAiEnabled(next)
                if (next) {
                  toast.success("Agente IA ativado")
                } else {
                  toast.info(
                    "Agente IA desativado. Será reativado automaticamente após 20 minutos de inatividade.",
                  )
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
                      "max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm text-sm",
                      message.sender === "agent"
                        ? "gradient-purple text-white shadow-purple/20"
                        : "bg-white dark:bg-gray-800 border border-purple-100 dark:border-purple-900/50",
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
                              <audio controls src={message.mediaUrl} className="w-full h-10" />
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
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="min-h-[40px] max-h-24 resize-none text-sm bg-white/80 dark:bg-gray-800/80 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600 rounded-lg"
                disabled={loading}
              />
            </div>
            <div className="flex space-x-1">
              <Button
                onClick={() => sendMessage()}
                disabled={loading || !newMessage.trim()}
                size="sm"
                className="h-8 w-8 p-0 gradient-purple hover:opacity-90 shadow-sm"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <Paperclip className="h-3 w-3" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            </div>
          </div>
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
      </CardContent>
    </Card>
  )
}