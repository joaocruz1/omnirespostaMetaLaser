// src/app/api/chats/[id]/messages/routes.ts

import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const chatId = params.id
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/message/findMessages/${INSTANCE_NAME}?jid=${chatId}`, {
      headers: {
        "apikey": EVOLUTION_API_KEY || ""
      }
    })

    if (!response.ok) {
      throw new Error("Falha ao buscar mensagens da API Evolution")
    }

    const messages = await response.json()

    // Formate os dados das mensagens conforme necessário
    return NextResponse.json(messages)

  } catch (error) {
    console.error("Falha ao buscar mensagens:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}