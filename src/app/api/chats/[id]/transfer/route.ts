import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await request.json()
    const chatId = params.id

    // Em produção, atualizar no banco de dados
    console.log(`Transferring chat ${chatId} to user ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to transfer chat:", error)
    return NextResponse.json({ error: "Erro ao transferir conversa" }, { status: 500 })
  }
}
