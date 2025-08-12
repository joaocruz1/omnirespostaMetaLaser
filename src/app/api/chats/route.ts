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
        isSavedContact: false, // Será atualizado posteriormente
      }
    })

    // Buscar todos os contatos do banco de dados
    const allContacts = await prisma.contact.findMany({
      select: {
        id: true,
        name: true,
      },
    })
    
    // Criar um mapa para busca rápida de contatos
    const contactMap = new Map(allContacts.map(contact => [contact.id, contact.name]))
    
    // Buscar chats locais
    const localChats = await prisma.chat.findMany({
      include: { contact: true },
    })

    // Buscar usuário "Agente IA" ou criar se não existir
    let aiAgent = await prisma.user.findFirst({
      where: { name: "Agente IA" }
    })

    if (!aiAgent) {
      aiAgent = await prisma.user.create({
        data: {
          name: "Agente IA",
          email: "ai@omni-metalaser.com",
          password: "ai-agent-password", // Senha temporária
          role: "agent"
        }
      })
    }
    const chatMap = new Map(formattedChats.map((c) => [c.id, c]))

    // Processar cada chat da API Evolution
    formattedChats.forEach((chat) => {
      // Extrair o número do telefone do remoteJid (remove @s.whatsapp.net)
      const phoneNumber = chat.id.split('@')[0]
      
      // Verificar se existe um contato salvo com esse número
      const savedContactName = contactMap.get(phoneNumber)
      
      if (savedContactName) {
        // Se o contato existe no banco, usar o nome salvo
        chat.contact = savedContactName
        chat.isSavedContact = true
      } else {
        // Se não existe, manter o nome original e marcar como não salvo
        chat.contact = `${chat.contact}`
        chat.isSavedContact = false
      }
    })

    // Atualizar chats da API Evolution com dados do banco local
    for (const localChat of localChats) {
      const existing = chatMap.get(localChat.id)
      if (existing) {
        // Atualizar com dados do banco local (exceto última mensagem que vem do webhook)
        existing.assignedTo = localChat.assignedTo || "N/A"
        existing.status = localChat.status as any
        // Última mensagem vem do webhook em tempo real, não do banco
        // existing.lastMessage = localChat.lastMessage || existing.lastMessage
        existing.unreadCount = localChat.unreadCount || existing.unreadCount
        existing.profilePicUrl = localChat.profilePicUrl || existing.profilePicUrl
      } else {
        // Para chats locais que não estão na API Evolution
        const phoneNumber = localChat.id.split('@')[0]
        const savedContactName = contactMap.get(phoneNumber)
        
        chatMap.set(localChat.id, {
          id: localChat.id,
          contact: savedContactName || `${phoneNumber} - Não Salvo`,
          lastMessage: "[Sem mensagens]", // Será atualizada pelo webhook
          timestamp: localChat.timestamp.toLocaleString("pt-BR"),
          unreadCount: localChat.unreadCount || 0,
          assignedTo: localChat.assignedTo || "N/A",
          status: localChat.status as any,
          profilePicUrl: localChat.profilePicUrl || null,
          isSavedContact: !!savedContactName,
        })
      }
    }

    // Atribuir conversas não atribuídas ao Agente IA (apenas para chats que não existem no banco)
    for (const chat of formattedChats) {
      const existingChat = localChats.find(c => c.id === chat.id)
      
      if (!existingChat) {
        // Criar novo chat no banco atribuído ao Agente IA
        const phoneNumber = chat.id.split('@')[0]
        const savedContactName = contactMap.get(phoneNumber)
        
        try {
          // Primeiro, verificar se o contato já existe
          let contact = await prisma.contact.findUnique({
            where: { id: phoneNumber }
          })

          if (!contact) {
            console.log(`Criando novo contato para chat: ${phoneNumber}`)
            // Se não existe, criar novo
            contact = await prisma.contact.create({
              data: {
                id: phoneNumber,
                name: savedContactName || null
              }
            })
          } else if (savedContactName && contact.name !== savedContactName) {
            console.log(`Atualizando nome do contato: ${phoneNumber}`)
            // Se existe mas o nome mudou, atualizar
            contact = await prisma.contact.update({
              where: { id: phoneNumber },
              data: { name: savedContactName }
            })
          }
          
          // Depois, criar o chat
          await prisma.chat.create({
            data: {
              id: chat.id,
              contactId: phoneNumber,
              assignedTo: "Agente IA",
              userId: aiAgent.id,
              status: "active",
              // lastMessage: chat.lastMessage, // Não salvar no banco, vem do webhook
              timestamp: new Date(),
              unreadCount: chat.unreadCount || 0,
              profilePicUrl: chat.profilePicUrl
            }
          })
          
          // Atualizar o chat no mapa
          chat.assignedTo = "Agente IA"
        } catch (error) {
          console.error("Erro ao criar chat no banco:", error)
          
          // Se for erro de contato duplicado, tentar apenas conectar o contato existente
          if (error instanceof Error && error.message.includes('Unique constraint failed')) {
            try {
              // Verificar se o chat já existe
              const existingChat = await prisma.chat.findUnique({
                where: { id: chat.id }
              })
              
              if (!existingChat) {
                                 await prisma.chat.create({
                   data: {
                     id: chat.id,
                     contactId: phoneNumber,
                     assignedTo: "Agente IA",
                     userId: aiAgent.id,
                     status: "active",
                     // lastMessage: chat.lastMessage, // Não salvar no banco, vem do webhook
                     timestamp: new Date(),
                     unreadCount: chat.unreadCount || 0,
                     profilePicUrl: chat.profilePicUrl
                   }
                 })
                chat.assignedTo = "Agente IA"
              }
            } catch (chatError) {
              console.error("Erro ao criar chat após falha no contato:", chatError)
            }
          }
        }
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
    const { id, contact, name, assignedTo } = await request.json()

    if (!id || !contact || !name) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    // Verificar se o chat já existe
    const existingChat = await prisma.chat.findUnique({
      where: { id }
    })

    if (existingChat) {
      return NextResponse.json({ error: "Chat já existe com este ID" }, { status: 409 })
    }

    // Verificar se o contato existe, se não, criar
    let contactRecord = await prisma.contact.findUnique({
      where: { id: contact }
    })

    if (!contactRecord) {
      contactRecord = await prisma.contact.create({
        data: { id: contact, name }
      })
    }

    const chat = await prisma.chat.create({
      data: {
        id,
        contactId: contact,
        assignedTo,
      },
      include: { contact: true },
    })

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error("Falha ao criar chat:", error)
    let errorMessage = "Erro desconhecido"
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('Unique constraint failed')) {
        errorMessage = "Chat ou contato já existe com este ID"
        statusCode = 409
      }
    }
    
    return NextResponse.json({ error: "Erro ao criar chat", details: errorMessage }, { status: statusCode })
  }
}
