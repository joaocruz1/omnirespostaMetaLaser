import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, type } = await request.json()

    // Extrair número do telefone do chatId (em produção, buscar do banco)
    const phoneNumber = "5535997478472" // Mock

    // Enviar mensagem via Evolution API
    const evolutionResponse = await fetch(`${EVOLUTION_API_BASE_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY || "",
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: message,
        delay: 123,
        linkPreview: true,
      }),
    })

    if (!evolutionResponse.ok) {
      throw new Error("Failed to send message via Evolution API")
    }

    const evolutionData = await evolutionResponse.json()

    // Em produção, salvar mensagem no banco de dados
    console.log("Message sent:", evolutionData)

    return NextResponse.json({ success: true, data: evolutionData })
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
