"use client"

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Pusher from 'pusher-js';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Settings, LogOut, Sparkles } from "lucide-react";
import { ChatList } from "@/components/chat-list";
import { ChatWindow } from "@/components/chat-window";
import { UserManagement } from "@/components/user-management";
import { InstanceSettings } from "@/components/instance-setting";
import { ThemeToggle } from "@/components/theme-toggle";

interface Chat {
  id: string;
  contact: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  assignedTo?: string;
  status: "active" | "waiting" | "closed";
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  // Estado para controlar as notificações de chats não lidos (agora um Map)
  const [unreadChats, setUnreadChats] = useState<Map<string, number>>(new Map());

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  // Função para lidar com a seleção de um chat
  const handleSelectChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    // Ao selecionar um chat, remove-o do mapa de contagem para limpar a notificação
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      newMap.delete(chat.id);
      return newMap;
    });
  }, []);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    loadChats();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('chat-updates');

    channel.bind('chat-event', (data: any) => {
      console.log("Pusher event received, reloading UI:", data);

      loadChats();

      // Lógica para incrementar a contagem de notificações
      if (data.event === 'messages.upsert' && data.data?.messages?.[0]) {
        const message = data.data.messages[0];
        const chatId = message.key.remoteJid;
        const isIncoming = !message.key.fromMe;

        if (isIncoming && chatId !== selectedChat?.id) {
          setUnreadChats(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(chatId) || 0;
            newMap.set(chatId, currentCount + 1); // Incrementa a contagem
            return newMap;
          });
        }
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [user, router, selectedChat?.id]); // Adicionado selectedChat.id como dependência

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/20">
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
              <ThemeToggle />
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
      <div className="flex-1 flex flex-col min-h-0 px-4 py-4">
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
                    onSelectChat={handleSelectChat}
                    onRefresh={loadChats}
                    unreadChats={unreadChats}
                  />
                </div>
                <div className="lg:col-span-2 min-h-0">
                  <ChatWindow
                    chat={selectedChat}
                    onChatUpdate={loadChats}
                  />
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
  );
}
