import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        name: true,
      },
    })
    console.log(contacts)
    return NextResponse.json(contacts)
  } catch (error) {
    console.error("Falha ao buscar contatos:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao buscar contatos", details: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, name } = await request.json()

    console.log(`Tentando criar/atualizar contato: ${id} com nome: ${name}`)

    if (!id) {
      return NextResponse.json({ error: "ID do contato é obrigatório" }, { status: 400 })
    }

    // Verificar se o contato já existe
    const existingContact = await prisma.contact.findUnique({
      where: { id }
    })

    if (existingContact) {
      console.log(`Contato ${id} já existe, atualizando nome se necessário`)
      // Se já existe, apenas atualizar o nome se fornecido
      if (name !== undefined) {
        const contact = await prisma.contact.update({
          where: { id },
          data: { name: name || null }
        })
        return NextResponse.json(contact, { status: 200 })
      }
      return NextResponse.json(existingContact, { status: 200 })
    }

    console.log(`Criando novo contato: ${id}`)
    // Se não existe, criar novo
    const contact = await prisma.contact.create({
      data: {
        id,
        name: name || null,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Falha ao criar contato:", error)
    let errorMessage = "Erro desconhecido"
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes('Unique constraint failed')) {
        errorMessage = "Contato já existe com este ID"
        statusCode = 409
      }
    }
    
    return NextResponse.json({ error: "Erro ao criar contato", details: errorMessage }, { status: statusCode })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "ID do contato é obrigatório" }, { status: 400 })
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: name || null,
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error("Falha ao atualizar contato:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao atualizar contato", details: errorMessage }, { status: 500 })
  }
}
