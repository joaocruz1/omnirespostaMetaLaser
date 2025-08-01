import { type NextRequest, NextResponse } from "next/server"

// Mock chats data
const mockChats = [
  {
    id: "1",
    contact: "+55 11 99999-9999",
    lastMessage: "Olá, gostaria de informações sobre os produtos",
    timestamp: "10:30",
    unreadCount: 2,
    assignedTo: "Agente 1",
    status: "active",
  },
  {
    id: "2",
    contact: "+55 11 88888-8888",
    lastMessage: "Obrigado pelo atendimento!",
    timestamp: "09:15",
    unreadCount: 0,
    assignedTo: "Admin",
    status: "closed",
  },
  {
    id: "3",
    contact: "+55 11 77777-7777",
    lastMessage: "Aguardando resposta...",
    timestamp: "08:45",
    unreadCount: 1,
    status: "waiting",
  },
]

export async function GET(request: NextRequest) {
  try {
    // Em produção, filtrar chats baseado no usuário logado
    return NextResponse.json(mockChats)
  } catch (error) {
    console.error("Failed to fetch chats:", error)
    return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
  }
}
