import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    const allEvents = [
      "APPLICATION_STARTUP", "QRCODE_UPDATED", "MESSAGES_SET", "MESSAGES_UPSERT",
      "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONTACTS_SET",
      "CONTACTS_UPSERT", "CONTACTS_UPDATE", "PRESENCE_UPDATE", "CHATS_SET",
      "CHATS_UPSERT", "CHATS_UPDATE", "CHATS_DELETE", "GROUPS_UPSERT",
      "GROUP_UPDATE", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE",
      "LABELS_EDIT", "LABELS_ASSOCIATION", "CALL", "TYPEBOT_START", "TYPEBOT_CHANGE_STATUS"
    ];

    // CRIA O OBJETO DE CONFIGURAÇÃO DO WEBHOOK
    const webhookConfig = {
      enabled: true,
      url: url,
      webhookByEvents: false,
      webhookBase64: true,
      events: allEvents
    };

    const response = await fetch(`${EVOLUTION_API_BASE_URL}/webhook/set/${INSTANCE_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY || "",
      },
      // ESTRUTURA CORRIGIDA: ENCAPSULA A CONFIGURAÇÃO DENTRO DE UM OBJETO "webhook"
      // Esta era a causa do erro!
      body: JSON.stringify({
        webhook: webhookConfig
      }),
    })

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("Erro detalhado da API da Evolution:", JSON.stringify(errorDetails, null, 2));
      throw new Error(`A API da Evolution retornou um erro: ${response.status} ${response.statusText}`);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update webhook:", error)
    return NextResponse.json({ error: "Erro ao atualizar webhook" }, { status: 500 })
  }
}