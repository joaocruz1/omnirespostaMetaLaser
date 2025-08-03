"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users, Settings, LogOut, Phone, Clock, CheckCircle, Sparkles } from "lucide-react"
import { ChatList } from "@/components/chat-list"
import { ChatWindow } from "@/components/chat-window"
import { UserManagement } from "@/components/user-management"
import { InstanceSettings } from "@/components/instance-setting"

interface Chat {
  id: string
  contact: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  assignedTo?: string
  status: "active" | "waiting" | "closed"
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    waitingChats: 0,
    closedChats: 0,
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    loadChats()
    loadStats()

    const interval = setInterval(() => {
      loadChats()
    }, 5000)

    return () => clearInterval(interval)
  }, [user, router])

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setChats(data)
      }
    } catch (error) {
      console.error("Failed to load chats:", error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/20">
      {/* Header */}
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-800/50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center shadow-purple">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    OmniResposta MetaLaser
                  </h1>
                  <p className="text-sm text-muted-foreground">Sistema de AI Chat</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
              >
                {user.role === "admin" ? "Administrador" : "Agente"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">Olá, {user.name}</p>
                <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-950/50 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 px-4 py-4">
        {/* Stats Cards - Compactas */}
      
        {/* Tabs Content */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="chats" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-purple-200/50 dark:border-purple-800/50 shadow-sm">
              <TabsTrigger
                value="chats"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-300"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Conversas
              </TabsTrigger>
              {user.role === "admin" && (
                <>
                  <TabsTrigger
                    value="users"
                    className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-300"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Usuários
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/50 dark:data-[state=active]:text-purple-300"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="chats" className="flex-1 mt-4 min-h-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-1 min-h-0">
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={setSelectedChat}
                    onRefresh={loadChats}
                  />
                </div>
                <div className="lg:col-span-2 min-h-0">
                  <ChatWindow chat={selectedChat} onChatUpdate={loadChats} />
                </div>
              </div>
            </TabsContent>

            {user.role === "admin" && (
              <>
                <TabsContent value="users" className="flex-1 mt-6 min-h-0 overflow-auto scrollbar-thin">
                  <UserManagement />
                </TabsContent>

                <TabsContent value="settings" className="flex-1 mt-6 min-h-0 overflow-auto scrollbar-thin">
                  <InstanceSettings />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
