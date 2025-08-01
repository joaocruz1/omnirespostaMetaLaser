import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/restart/${INSTANCE_NAME}`, {
      method: "POST",
      headers: {
        apikey: EVOLUTION_API_KEY || "",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to restart instance")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to restart instance:", error)
    return NextResponse.json({ error: "Erro ao reiniciar instância" }, { status: 500 })
  }
}
