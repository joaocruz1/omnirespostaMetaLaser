import { NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

type RouteContext = {
  params: Promise<{ id: string; messageId: string }>
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const params = await context.params
  const { id: chatId, messageId } = params

  try {
    if (!chatId || !messageId) {
      return NextResponse.json({ error: "Chat ID e Message ID são obrigatórios" }, { status: 400 })
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    if (EVOLUTION_API_KEY) {
      headers["apikey"] = EVOLUTION_API_KEY
    }

    // Primeiro, buscar a mensagem específica
    const messageResponse = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findMessages/${INSTANCE_NAME}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: chatId,
            id: messageId,
          },
        },
        limit: 1,
      }),
    })

    if (!messageResponse.ok) {
      throw new Error("Falha ao buscar mensagem")
    }

    const messageData = await messageResponse.json()
    const message = messageData?.messages?.records?.[0]

    if (!message) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
    }

    // Determinar se é vídeo para usar conversão
    const isVideo = !!message.message?.videoMessage

    const bodyData = {
      message: {
        key: {
          id: messageId,
        },
      },
      ...(isVideo ? { convertToMp4: true } : {}),
    }

    const mediaResponse = await fetch(`${EVOLUTION_API_BASE_URL}/chat/getBase64FromMediaMessage/${INSTANCE_NAME}`, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyData),
    })

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text()
      console.error(`Erro da Evolution API [${mediaResponse.status}]: ${errorText}`)
      throw new Error("Falha ao buscar mídia")
    }

    const mediaData = await mediaResponse.json()

    if (mediaData?.mimetype && mediaData?.base64) {
      const mediaUrl = `data:${mediaData.mimetype};base64,${mediaData.base64}`
      return NextResponse.json({ mediaUrl })
    } else {
      throw new Error("Dados de mídia inválidos")
    }
  } catch (error) {
    console.error("Erro ao buscar mídia:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao buscar mídia", details: errorMessage }, { status: 500 })
  }
}
