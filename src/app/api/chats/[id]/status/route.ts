import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const chatId = params.id

    if (!status || !["active", "waiting", "closed"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 })
    }

    // Atualizar o status do chat no banco de dados
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { status },
      include: { contact: true }
    })

    return NextResponse.json({ 
      success: true, 
      chat: updatedChat 
    })
  } catch (error) {
    console.error("Failed to update chat status:", error)
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
