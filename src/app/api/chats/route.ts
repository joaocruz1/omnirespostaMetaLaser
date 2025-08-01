// src/app/api/chats/route.ts

import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findChats/${INSTANCE_NAME}`, {
      headers: {
        "apikey": EVOLUTION_API_KEY || ""
      }
    })

    if (!response.ok) {
      throw new Error("Falha ao buscar conversas da API Evolution")
    }

    const chats = await response.json()

    // Aqui você pode adicionar lógica para formatar os dados dos chats conforme necessário
    return NextResponse.json(chats)

  } catch (error) {
    console.error("Falha ao buscar conversas:", error)
    return NextResponse.json({ error: "Erro ao buscar conversas" }, { status: 500 })
  }
}