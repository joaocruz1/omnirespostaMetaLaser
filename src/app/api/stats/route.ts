import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Em produção, buscar estatísticas reais do banco de dados
    const stats = {
      totalChats: 15,
      activeChats: 5,
      waitingChats: 3,
      closedChats: 7,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
  }
}
