import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Mock users database
const users = [
  {
    id: "1",
    name: "Admin",
    email: "admin@metalaser.com",
    role: "admin",
  },
  {
    id: "2",
    name: "Agente 1",
    email: "agente1@metalaser.com",
    role: "agent",
  },
]

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const user = users.find((u) => u.id === decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }
}
