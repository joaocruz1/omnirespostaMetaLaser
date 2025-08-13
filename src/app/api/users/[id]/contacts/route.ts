import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token de autenticação necessário" }, { status: 401 })
    }

    const userId = id

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Buscar todos os chats atribuídos a este usuário pelo campo assignedTo
    const userChats = await prisma.chat.findMany({
      where: {
        assignedTo: user.name
      },
      include: {
        contact: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Formatar os dados dos contatos
    const contacts = userChats.map(chat => ({
      id: chat.id,
      contactName: chat.contact?.name || chat.id.split('@')[0],
      phoneNumber: chat.id.split('@')[0],
      isSavedContact: !!chat.contact,
      lastMessage: chat.lastMessage || "Nenhuma mensagem",
      status: chat.status,
      assignedTo: chat.assignedTo,
      createdAt: chat.timestamp,
      updatedAt: chat.timestamp
    }))

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name
      },
      contacts,
      totalContacts: contacts.length
    })

  } catch (error) {
    console.error("Erro ao buscar contatos do usuário:", error)
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 })
  }
}
