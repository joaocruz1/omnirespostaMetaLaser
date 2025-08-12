import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const chatId = params.id

    // Verificar se o chat existe
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId }
    })

    if (!existingChat) {
      return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 })
    }

    // Se userId for null, transferir para Agente IA
    if (userId === null) {
      const updatedChat = await prisma.chat.update({
        where: { id: chatId },
        data: {
          assignedTo: "Agente IA",
          userId: null
        },
        include: { contact: true }
      })

      return NextResponse.json({ 
        success: true, 
        chat: updatedChat 
      })
    }

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
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        assignedTo: user.name,
        userId: userId
      },
      include: { contact: true }
    })

    return NextResponse.json({ 
      success: true, 
      chat: updatedChat 
    })
  } catch (error) {
    console.error("Failed to transfer chat:", error)
    return NextResponse.json({ error: "Erro ao transferir conversa" }, { status: 500 })
  }
}
