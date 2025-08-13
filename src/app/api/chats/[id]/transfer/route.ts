import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { userId } = await request.json()
    const chatId = id

    // Verificar se o chat existe
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId }
    })

    if (!existingChat) {
      return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 })
    }

    let updatedChat: any

    // Se userId for null, transferir para Agente IA
    if (userId === null) {
      updatedChat = await prisma.chat.update({
        where: { id: chatId },
        data: {
          assignedTo: "Agente IA",
          userId: null
        },
        include: { contact: true }
      })
    } else {
      // Se userId for fornecido, transferir para o usuário específico
      if (!userId) {
        return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 })
      }

      // Buscar o usuário para obter o nome
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })

      if (!user) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      // Atualizar o chat no banco de dados
      updatedChat = await prisma.chat.update({
        where: { id: chatId },
        data: {
          assignedTo: user.name,
          userId: userId
        },
        include: { contact: true }
      })
    }

    // Disparar evento Pusher para notificar o frontend sobre a transferência
    try {
      await pusherServer.trigger('chat-updates', 'chat-event', {
        event: 'chats.update',
        chatId: chatId,
        chat: updatedChat,
        timestamp: new Date().toISOString()
      })
      console.log(`Pusher event triggered for chat transfer: ${chatId}`)
    } catch (pusherError) {
      console.error("Erro ao disparar evento Pusher:", pusherError)
      // Não falhar a operação se o Pusher falhar
    }

    return NextResponse.json({ 
      success: true, 
      chat: updatedChat 
    })
  } catch (error) {
    console.error("Failed to transfer chat:", error)
    return NextResponse.json({ error: "Erro ao transferir conversa" }, { status: 500 })
  }
}
