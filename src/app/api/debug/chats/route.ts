import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    // Buscar todos os chats com seus dados
    const allChats = await prisma.chat.findMany({
      include: {
        contact: true,
        user: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Formatar para debug
    const debugData = allChats.map(chat => ({
      id: chat.id,
      assignedTo: chat.assignedTo,
      userId: chat.userId,
      userName: chat.user?.name,
      contactName: chat.contact?.name,
      status: chat.status,
      lastMessage: chat.lastMessage,
      timestamp: chat.timestamp
    }))

    return NextResponse.json({
      success: true,
      totalChats: allChats.length,
      chats: debugData
    })

  } catch (error) {
    console.error("Erro ao buscar dados de debug:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}
