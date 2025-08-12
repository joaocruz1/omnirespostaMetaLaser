import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Buscar todos os chats que não estão atribuídos ao Agente IA
    const chatsToTransfer = await prisma.chat.findMany({
      where: {
        OR: [
          { assignedTo: { not: "Agente IA" } },
          { assignedTo: null }
        ]
      },
      select: {
        id: true,
        assignedTo: true
      }
    })

    if (chatsToTransfer.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Todos os chats já estão com o Agente IA",
        transferredCount: 0
      })
    }

    // Transferir todos os chats para o Agente IA
    const updateResult = await prisma.chat.updateMany({
      where: {
        OR: [
          { assignedTo: { not: "Agente IA" } },
          { assignedTo: null }
        ]
      },
      data: {
        assignedTo: "Agente IA",
        userId: null
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: `${updateResult.count} chats foram transferidos para o Agente IA`,
      transferredCount: updateResult.count
    })

  } catch (error) {
    console.error("Erro ao transferir chats para Agente IA:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}
