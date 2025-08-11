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

    if (!id) {
      return NextResponse.json({ error: "ID do contato é obrigatório" }, { status: 400 })
    }

    const contact = await prisma.contact.create({
      data: {
        id,
        name: name || null,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Falha ao criar contato:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json({ error: "Erro ao criar contato", details: errorMessage }, { status: 500 })
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
