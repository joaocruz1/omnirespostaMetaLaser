import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Mock users database
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

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(users)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    // Verificar se email já existe
    if (users.find((u) => u.email === email)) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 400 })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      role,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
