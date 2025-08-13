"use client"

import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Pusher from 'pusher-js';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Settings, LogOut } from "lucide-react";
import { ChatList } from "@/components/chat-list";
import { ChatWindow } from "@/components/chat-window";
import { UserManagement } from "@/components/user-management";
import { InstanceSettings } from "@/components/instance-setting";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { useTheme } from "next-themes"; // <-- adicionado
import { useNotificationSound } from "@/hooks/use-notification-sound";

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
  const { playNotificationSound } = useNotificationSound();

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [lastPusherEvent, setLastPusherEvent] = useState<any>(null);
  const [unreadChats, setUnreadChats] = useState<Map<string, number>>(new Map());
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  
  // Referência para o chat selecionado atual para evitar re-renderizações
  const selectedChatRef = useRef<Chat | null>(null);
  selectedChatRef.current = selectedChat;

  // --- LÓGICA DO ÍCONE POR TEMA (única mudança funcional) ---
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const iconSrc = mounted && resolvedTheme === "dark"
    ? "/iconNextWhite.png"
    : "/NextIcon.png";
  // ----------------------------------------------------------

  // Função para atualizar o chat selecionado com dados atualizados
  const updateSelectedChat = useCallback((updatedChats: Chat[]) => {
    setSelectedChat(prevSelectedChat => {
      if (!prevSelectedChat) return prevSelectedChat;
      
      const updatedChat = updatedChats.find(chat => chat.id === prevSelectedChat.id);
      if (!updatedChat) return prevSelectedChat;
      
      // Verificar se realmente precisa atualizar usando comparação mais eficiente
      if (prevSelectedChat.lastMessage === updatedChat.lastMessage &&
          prevSelectedChat.timestamp === updatedChat.timestamp &&
          prevSelectedChat.unreadCount === updatedChat.unreadCount &&
          prevSelectedChat.assignedTo === updatedChat.assignedTo &&
          prevSelectedChat.status === updatedChat.status) {
        return prevSelectedChat; // Não atualizar se os dados são os mesmos
      }
      
      return updatedChat;
    });
  }, []); // Sem dependências para evitar recriações

  const loadChats = useCallback(async () => {
    if (isLoadingChats) return; // Evitar chamadas simultâneas
    
    setIsLoadingChats(true);
    try {
      const response = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChats(data);
        updateSelectedChat(data);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, []); // Sem dependências para evitar recriações

  // Função para atualizar apenas o chat selecionado sem recarregar toda a lista
  const updateSelectedChatOnly = useCallback(async () => {
    try {
      // Buscar apenas o chat específico da lista atual
      const response = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const allChats = await response.json();
        // Usar setSelectedChat com uma função para acessar o valor atual
        setSelectedChat(prevSelectedChat => {
          if (!prevSelectedChat) return prevSelectedChat;
          
          const updatedChat = allChats.find((chat: Chat) => chat.id === prevSelectedChat.id);
          if (updatedChat) {
            // Verificar se realmente precisa atualizar
            if (prevSelectedChat.lastMessage === updatedChat.lastMessage &&
                prevSelectedChat.timestamp === updatedChat.timestamp &&
                prevSelectedChat.unreadCount === updatedChat.unreadCount &&
                prevSelectedChat.assignedTo === updatedChat.assignedTo &&
                prevSelectedChat.status === updatedChat.status) {
              return prevSelectedChat; // Não atualizar se os dados são os mesmos
            }
            
            // Também atualizar na lista de chats
            setChats(prevChats => 
              prevChats.map(chat => 
                chat.id === prevSelectedChat.id ? updatedChat : chat
              )
            );
            return updatedChat;
          }
          return prevSelectedChat;
        });
      }
    } catch (error) {
      console.error("Failed to update selected chat:", error);
    }
  }, []); // Sem dependências para evitar recriações

  // Função para atualizar a última mensagem de um chat específico
  const updateChatLastMessage = useCallback((chatId: string, messageContent: string, timestamp?: string) => {
    setChats(prevChats => {
      // Verificar se realmente precisa atualizar
      const chatToUpdate = prevChats.find(chat => chat.id === chatId);
      if (chatToUpdate && chatToUpdate.lastMessage === messageContent && chatToUpdate.timestamp === timestamp) {
        return prevChats; // Não atualizar se a mensagem e timestamp são os mesmos
      }
      
      return prevChats.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              lastMessage: messageContent,
              timestamp: timestamp || new Date().toLocaleString("pt-BR")
            }
          : chat
      );
    });
  }, []); // Sem dependências para evitar recriações

  const handleSelectChat = useCallback((chat: Chat) => {
    // Verificar se o chat selecionado é realmente diferente
    setSelectedChat(prevSelectedChat => {
      if (prevSelectedChat?.id === chat.id) {
        return prevSelectedChat; // Não atualizar se é o mesmo chat
      }
      return chat;
    });
    
    // Limpar contador de mensagens não lidas quando selecionar o chat
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      newMap.delete(chat.id);
      return newMap;
    });
    
    // Atualizar contador no banco de dados apenas se necessário
    if (chat.unreadCount > 0) {
      fetch(`/api/chats/${chat.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ unreadCount: 0 }),
      }).catch(error => {
        console.error('Erro ao limpar contador de mensagens não lidas:', error);
      });
    }
  }, []); // Sem dependências para evitar recriações

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Solicitar permissão para notificações
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    loadChats();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('chat-updates');

    channel.bind('chat-event', (data: any) => {
      console.log("Pusher event received:", data);
      setLastPusherEvent(data);

      // Verificar se é uma nova mensagem
      if (data.event === 'messages.upsert' && data.message) {
        const chatId = data.chatId;
        const isIncoming = data.message.isIncoming;

        // Atualizar a última mensagem do chat na interface (vem diretamente do webhook)
        const messageTimestamp = data.message.timestamp 
          ? new Date(data.message.timestamp * 1000).toLocaleString("pt-BR")
          : new Date().toLocaleString("pt-BR");
        
        updateChatLastMessage(chatId, data.message.content, messageTimestamp);

        if (isIncoming && chatId !== selectedChatRef.current?.id) {
          // Atualizar contador de mensagens não lidas
          setUnreadChats(prev => {
            const newMap = new Map(prev);
            const currentCount = newMap.get(chatId) || 0;
            newMap.set(chatId, currentCount + 1);
            return newMap;
          });

          // Tocar som de notificação
          playNotificationSound();

          // Mostrar notificação do navegador
          if (Notification.permission === "granted") {
            const contactName = chats.find(chat => chat.id === chatId)?.contact || "Contato";
            new Notification("Nova mensagem", {
              body: `${contactName}: ${data.message.content}`,
              icon: "/iconNextBlack.png",
              tag: chatId, // Evita notificações duplicadas
              requireInteraction: false
            });
          }
        }
      } else if (data.event === 'messages.update') {
        // Para atualizações de status, apenas atualizar o evento
        // A interface será atualizada pelo chat-window
      } else if (data.event === 'chats.update') {
        // Para atualizações de chat (transferência, status, etc.), atualizar a lista
        console.log("Chat update event received:", data);
        
        // Atualizar o chat específico na lista
        if (data.chat) {
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === data.chatId 
                ? { 
                    ...chat, 
                    assignedTo: data.chat.assignedTo,
                    status: data.chat.status,
                    userId: data.chat.userId
                  }
                : chat
            )
          );
          
          // Se o chat atualizado é o selecionado, atualizar também
          if (selectedChatRef.current?.id === data.chatId) {
            setSelectedChat(prev => 
              prev ? { 
                ...prev, 
                assignedTo: data.chat.assignedTo,
                status: data.chat.status,
                userId: data.chat.userId
              } : prev
            );
          }
        } else {
          // Se não temos dados específicos do chat, recarregar toda a lista
          loadChats();
        }
      } else {
        // Para outros eventos (contacts.update, etc.), recarregar a lista
        loadChats();
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [user, router, updateChatLastMessage, playNotificationSound, loadChats]); // Remover selectedChatRef.current?.id das dependências

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-purple-50/30 dark:to-purple-950/20">
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-purple-200/50 dark:border-purple-800/50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center">
                  {/* Usa o ícone conforme o tema */}
                  <Image
                    src={iconSrc}
                    alt="OmniResposta MetaLaser"
                    width={60}
                    height={60}
                    priority
                  />
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
                    onUpdateSelectedChat={updateSelectedChatOnly}
                    lastPusherEvent={lastPusherEvent}
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
