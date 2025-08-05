"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, RefreshCw, User, Clock, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  contact: string
  lastMessage: any
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
  profilePicUrl?: string
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
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "waiting" | "closed">("all")

  const filteredChats = chats.filter((chat) => {
    const contactMatch =
      typeof chat.contact === "string" && chat.contact.toLowerCase().includes(searchTerm.toLowerCase())
    const messageMatch =
      typeof chat.lastMessage === "string" && chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSearch = contactMatch || messageMatch
    const matchesFilter = filter === "all" || chat.status === filter
    return matchesSearch && matchesFilter
  })

  return (
    <Card className="h-full flex flex-col bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-purple-200/50 dark:border-purple-800/50 shadow-sm">
      <CardHeader className="flex-shrink-0 pb-3 px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-base font-semibold flex items-center space-x-2">
            <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Conversas</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-7 w-7 p-0 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-sm bg-white/80 dark:bg-gray-800/80 border-purple-200/50 dark:border-purple-800/50 focus:border-purple-400 dark:focus:border-purple-600"
            />
          </div>
          <div className="flex space-x-1">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className={cn(
                "h-7 px-2 text-xs",
                filter === "all"
                  ? "gradient-purple text-white"
                  : "border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50",
              )}
            >
              Todas
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
              className={cn(
                "h-7 px-2 text-xs",
                filter === "active"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/50",
              )}
            >
              Ativas
            </Button>
            <Button
              variant={filter === "waiting" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("waiting")}
              className={cn(
                "h-7 px-2 text-xs",
                filter === "waiting"
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-950/50",
              )}
            >
              Aguardando
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full scrollbar-thin">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {filteredChats.map((chat) => {
                const newMessagesCount = unreadChats.get(chat.id)
                return (
                  <div
                    key={chat.id}
                    className={cn(
                      "p-3 cursor-pointer rounded-lg transition-all duration-200 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/50",
                      selectedChat?.id === chat.id
                        ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 shadow-sm"
                        : "hover:bg-white/80 dark:hover:bg-gray-800/50",
                    )}
                    onClick={() => onSelectChat(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-shrink-0 mr-3">
                        {chat.profilePicUrl ? (
                          <img
                            src={chat.profilePicUrl || "/placeholder.svg"}
                            alt="Foto de Perfil"
                            className="w-10 h-10 rounded-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm truncate text-foreground">{chat.contact}</p>
                          {newMessagesCount && newMessagesCount > 0 ? (
                            <Badge
                              variant="destructive"
                              className="ml-auto flex-shrink-0 text-xs px-1.5 py-0 h-4 bg-red-500 hover:bg-red-600"
                            >
                              {newMessagesCount}
                            </Badge>
                          ) : (
                            chat.unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto flex-shrink-0 text-xs px-1.5 py-0 h-4 bg-red-500 hover:bg-red-600"
                              >
                                {chat.unreadCount}
                              </Badge>
                            )
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2 leading-relaxed">
                          {typeof chat.lastMessage === "string" ? chat.lastMessage : "[Mídia]"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{chat.timestamp}</span>
                          </div>
                          {chat.assignedTo && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-16">{chat.assignedTo}</span>
                            </div>
                          )}
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
