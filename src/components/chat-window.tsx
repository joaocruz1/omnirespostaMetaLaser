"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { Send, Paperclip, UserCheck, MoreVertical, Archive, UserX, MessageSquare, User, Circle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  contact: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
}

interface Message {
  id: string
  content: string
  type: "text" | "image" | "audio" | "document" | "location"
  sender: "user" | "agent" | "customer"
  timestamp: string
  mediaUrl?: string
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
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { user } = useAuth()

  const loadMessages = async () => {
    if (!chat) return

    try {
      const response = await fetch(`/api/chats/${chat.id}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Failed to load messages:", error)
    }
  }

  useEffect(() => {
    if (chat) {
      loadMessages()
      loadUsers()
    } else {
      setMessages([])
    }
  }, [chat, lastPusherEvent])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || loading) return;

    setLoading(true);

    const messageToSend = newMessage;
    
    // UI Otimista: Adiciona a mensagem à UI antes mesmo da confirmação da API
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageToSend,
      sender: "agent",
      type: "text",
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage("");

    try {
      const response = await fetch(`/api/messages/${chat.id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (response.ok) {
        // A mensagem foi enviada com sucesso.
        // A atualização via webhook/Pusher irá substituir a mensagem otimista pela versão final do servidor.
        toast.success("Mensagem enviada com sucesso");
        // Atualiza a lista de chats para refletir a nova última mensagem.
        onChatUpdate();
      } else {
        // Se o envio falhar, remove a mensagem otimista e restaura o texto no input.
        toast.error("Falha ao enviar mensagem.");
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        setNewMessage(messageToSend);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Erro ao enviar mensagem.");
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageToSend);
    } finally {
      setLoading(false);
    }
  };

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
              <User className="h-5 w-5 text-white" />
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

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full scrollbar-thin">
            <div className="p-4 space-y-3">
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
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p
                      className={cn(
                        "text-xs mt-1 text-right",
                        message.sender === "agent" ? "text-purple-100" : "text-muted-foreground",
                      )}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <div className="border-t border-purple-200/30 dark:border-purple-800/30 p-4 bg-gradient-to-r from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
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
              />
            </div>
            <div className="flex space-x-1">
              <Button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                size="sm"
                className="h-8 w-8 p-0 gradient-purple hover:opacity-90 shadow-sm"
              >
                <Send className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
              >
                <Paperclip className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}