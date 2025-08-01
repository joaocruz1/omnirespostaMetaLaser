import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
    const chatId = params.id

    // Em produção, atualizar no banco de dados
    console.log(`Updating chat ${chatId} status to ${status}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update chat status:", error)
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 })
  }
}
