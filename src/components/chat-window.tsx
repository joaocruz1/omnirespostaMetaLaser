"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { Send, Paperclip, ImageIcon, UserCheck, MoreVertical, Archive, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageSquare } from "lucide-react" // Declare MessageSquare here
import { toast } from "sonner"

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
}

export function ChatWindow({ chat, onChatUpdate }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { user } = useAuth()

  useEffect(() => {
    if (chat) {
      loadMessages()
      loadUsers()
    }
  }, [chat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

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
    if (!newMessage.trim() || !chat || loading) return

    setLoading(true)
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          chatId: chat.id,
          message: newMessage,
          type: "text",
        }),
      })

      if (response.ok) {
        setNewMessage("")
        loadMessages()
        onChatUpdate()
        toast.success("Mensagem enviada com sucesso")
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Erro ao enviar mensagem")
    } finally {
      setLoading(false)
    }
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

  if (!chat) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" />
            <p>Selecione uma conversa para começar</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{chat.contact}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={chat.status === "active" ? "default" : "secondary"}>
                {chat.status === "active" ? "Ativo" : chat.status === "waiting" ? "Aguardando" : "Finalizado"}
              </Badge>
              {chat.assignedTo && <Badge variant="outline">Atribuído a: {chat.assignedTo}</Badge>}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Select onValueChange={transferChat}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Transferir" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateChatStatus("active")}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Marcar como Ativo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateChatStatus("waiting")}>
                  <UserX className="h-4 w-4 mr-2" />
                  Marcar como Aguardando
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateChatStatus("closed")}>
                  <Archive className="h-4 w-4 mr-2" />
                  Finalizar Conversa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "agent" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
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
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ImageIcon className="h-4 w-4" /> {/* Updated Image to ImageIcon */}
              </Button>
              <Button onClick={sendMessage} disabled={loading || !newMessage.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
