import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json()
    const chatId = params.id

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }
    const chatExists = await prisma.chat.findUnique({ where: { id: chatId } })
    if (!chatExists) {
      return NextResponse.json(
        { error: "Conversa não encontrada" },
        { status: 404 }
      )
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { assignedTo: user.name, userId: user.id },
    })

    await pusherServer.trigger("chat-updates", "chat-event", {
      event: "chats.update",
      chatId: chatId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, chat })
  } catch (error) {
    console.error("Failed to transfer chat:", error)
    return NextResponse.json({ error: "Erro ao transferir conversa" }, { status: 500 })
  }
}
