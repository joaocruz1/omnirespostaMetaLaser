import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function POST(request: NextRequest) {
  try {
    // Primeiro, tentar conectar à instância existente
    let response = await fetch(`${EVOLUTION_API_BASE_URL}/instance/connect/${INSTANCE_NAME}`, {
      headers: {
        apikey: EVOLUTION_API_KEY || "",
      },
    })
    // Se a instância não existir, criar uma nova
    if (!response.ok) {
      const createResponse = await fetch(`${EVOLUTION_API_BASE_URL}/instance/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY || "",
        },
        body: JSON.stringify({
          instanceName: INSTANCE_NAME,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })

      if (!createResponse.ok) {
        throw new Error("Failed to create instance")
      }

      response = createResponse
    }

    const data = await response.json()

    // Configurar webhook se a instância foi criada/conectada com sucesso
    if (data.status === 201 || data.status === 200) {
      await setupWebhook()
    }

    return NextResponse.json({
      instanceName: INSTANCE_NAME,
      status: "connected",
      qrCode: data.qrcode,
    })
  } catch (error) {
    console.error("Failed to connect instance:", error)
    return NextResponse.json({ error: "Erro ao conectar instância" }, { status: 500 })
  }
}

async function setupWebhook() {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhook`

    await fetch(`${EVOLUTION_API_BASE_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY || "",
      },
      body: JSON.stringify({
        enabled: true,
        url: webhookUrl,
        events: ["MESSAGE", "STATUS", "CONNECTION"],
      }),
    })
  } catch (error) {
    console.error("Failed to setup webhook:", error)
  }
}
