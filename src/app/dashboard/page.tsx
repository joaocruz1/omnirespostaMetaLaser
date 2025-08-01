"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Users, Settings, LogOut, Phone, Clock, CheckCircle } from "lucide-react"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Metalaser WhatsApp</h1>
              <Badge variant="secondary">{user.role === "admin" ? "Administrador" : "Agente"}</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Olá, {user.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChats}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <Phone className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeChats}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.waitingChats}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.closedChats}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="chats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chats">
              <MessageSquare className="h-4 w-4 mr-2" />
              Conversas
            </TabsTrigger>
            {user.role === "admin" && (
              <>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="chats" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
              <div className="lg:col-span-1">
                <ChatList
                  chats={chats}
                  selectedChat={selectedChat}
                  onSelectChat={setSelectedChat}
                  onRefresh={loadChats}
                />
              </div>
              <div className="lg:col-span-2">
                <ChatWindow chat={selectedChat} onChatUpdate={loadChats} />
              </div>
            </div>
          </TabsContent>

          {user.role === "admin" && (
            <>
              <TabsContent value="users">
                <UserManagement />
              </TabsContent>

              <TabsContent value="settings">
                <InstanceSettings />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
