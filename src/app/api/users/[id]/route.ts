import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Mock users database (em produção, usar banco de dados real)
const users = [
  {
    id: "1",
    name: "Admin",
    email: "admin@metalaser.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Agente 1",
    email: "agente1@metalaser.com",
    role: "agent",
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
]

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, email, password, role } = await request.json()
    const userId = params.id

    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar se email já está em uso por outro usuário
    const existingUser = users.find((u) => u.email === email && u.id !== userId)
    if (existingUser) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Atualizar usuário
    users[userIndex] = {
      ...users[userIndex],
      name,
      email,
      role,
    }

    // Se senha foi fornecida, atualizar hash (em produção)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      // Salvar hashedPassword no banco
    }

    return NextResponse.json(users[userIndex])
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    users.splice(userIndex, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
  }
}
