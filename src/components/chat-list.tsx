"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, RefreshCw, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  contact: string
  lastMessage: any // Alterado para 'any' para refletir a realidade dos dados recebidos
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
}

interface ChatListProps {
  chats: Chat[]
  selectedChat: Chat | null
  onSelectChat: (chat: Chat) => void
  onRefresh: () => void
}

export function ChatList({ chats, selectedChat, onSelectChat, onRefresh }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "waiting" | "closed">("all")

  const filteredChats = chats.filter((chat) => {
    const contactMatch =
      typeof chat.contact === 'string' && chat.contact.toLowerCase().includes(searchTerm.toLowerCase());
    const messageMatch =
      typeof chat.lastMessage === 'string' && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSearch = contactMatch || messageMatch;
    const matchesFilter = filter === "all" || chat.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "waiting":
        return "bg-yellow-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
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

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Conversas</CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex space-x-1">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Todas
            </Button>
            <Button variant={filter === "active" ? "default" : "outline"} size="sm" onClick={() => setFilter("active")}>
              Ativas
            </Button>
            <Button
              variant={filter === "waiting" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("waiting")}
            >
              Aguardando
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-400px)]">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">Nenhuma conversa encontrada</div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "p-3 cursor-pointer hover:bg-muted/50 border-b transition-colors",
                    selectedChat?.id === chat.id && "bg-muted",
                  )}
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className={cn("w-2 h-2 rounded-full", getStatusColor(chat.status))} />
                        <p className="font-medium text-sm truncate">{chat.contact}</p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">{typeof chat.lastMessage === 'string' ? chat.lastMessage : '[Mídia]'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{chat.timestamp}</span>
                        </div>
                        {chat.assignedTo && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{chat.assignedTo}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {getStatusText(chat.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}