import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findChats/${INSTANCE_NAME}`, {
      method: "POST",
      headers: {
        apikey: EVOLUTION_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Erro da API Evolution:", errorBody)
      throw new Error("Falha ao buscar conversas da API Evolution")
    }

    const rawChats = await response.json()
    const validChats = Array.isArray(rawChats)
      ? rawChats.filter((chat: any) => chat && typeof chat.remoteJid === "string")
      : []

    // Processamento mais rápido - sem carregar mídias aqui
    const formattedChats = validChats.map((chat: any) => {
      const contactName = chat.pushName || chat.remoteJid.split("@")[0]

      let lastMessageText = "[Sem mensagens]"
      if (chat.lastMessage && chat.lastMessage.message) {
        lastMessageText =
          chat.lastMessage.message.conversation ||
          chat.lastMessage.message.extendedTextMessage?.text ||
          (chat.lastMessage.message.reactionMessage
            ? `[Reação: ${chat.lastMessage.message.reactionMessage.text}]`
            : "") ||
          (chat.lastMessage.message.stickerMessage ? "[Figurinha]" : "") ||
          (chat.lastMessage.message.imageMessage ? "[Imagem]" : "") ||
          (chat.lastMessage.message.audioMessage ? "[Áudio]" : "") ||
          (chat.lastMessage.message.videoMessage ? "[Vídeo]" : "") ||
          (chat.lastMessage.message.documentMessage ? "[Documento]" : "") ||
          `[Tipo de mensagem não suportado]`
      }

      const timestamp = chat.lastMessage?.messageTimestamp
        ? new Date(chat.lastMessage.messageTimestamp * 1000).toLocaleString("pt-BR")
        : new Date(chat.updatedAt).toLocaleString("pt-BR")

      return {
        id: chat.remoteJid,
        contact: contactName,
        lastMessage: lastMessageText,
        timestamp: timestamp,
        unreadCount: chat.unreadCount || 0,
        assignedTo: "N/A",
        status: "active" as const,
        profilePicUrl: chat.profilePicUrl || null,
      }
    })

    const localChats = await prisma.chat.findMany({
      include: { contact: true },
    })
    const chatMap = new Map(formattedChats.map((c) => [c.id, c]))

    for (const chat of localChats) {
      const existing = chatMap.get(chat.id)
      if (existing) {
        existing.assignedTo = chat.assignedTo || existing.assignedTo
      } else {
        chatMap.set(chat.id, {
          id: chat.id,
          contact: chat.contact?.id || "",
          lastMessage: chat.lastMessage || "[Sem mensagens]",
          timestamp: chat.timestamp.toLocaleString("pt-BR"),
          unreadCount: chat.unreadCount || 0,
          assignedTo: chat.assignedTo || "N/A",
          status: chat.status as any,
          profilePicUrl: chat.profilePicUrl || null,
        })
      }
    }

    return NextResponse.json(Array.from(chatMap.values()))
  } catch (error) {
    console.error("Falha ao buscar conversas:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao buscar conversas", details: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, contact, assignedTo } = await request.json()

    if (!id || !contact) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const chat = await prisma.chat.create({
      data: {
        id,
        contact: {
          connectOrCreate: {
            where: { id: contact },
            create: { id: contact },
          },
        },
        assignedTo,
      },
      include: { contact: true },
    })

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error("Falha ao criar chat:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao criar chat", details: errorMessage }, { status: 500 })
  }
}
