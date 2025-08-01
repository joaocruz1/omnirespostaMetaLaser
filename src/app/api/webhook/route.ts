import { type NextRequest, NextResponse } from "next/server"
import { broadcast } from '@/lib/websocket';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()

    console.log("Webhook received:", webhookData)


    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      // Eventos da Evolution API
      case "messages.upsert":
        await handleNewMessage(webhookData)
        break
      
      case "chats.update":
        console.log("Chat update event received:", webhookData.data)
        break

      case "connection.update":
        await handleConnectionUpdate(webhookData)
        break

      // Mantendo compatibilidade com eventos antigos (opcional)
      case "MESSAGE":
        await handleNewMessage(webhookData)
        break
      case "STATUS":
        await handleStatusUpdate(webhookData)
        break
      case "CONNECTION":
        await handleConnectionUpdate(webhookData)
        break

      default:
        console.log("Unknown webhook event:", webhookData.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}

async function handleNewMessage(data: any) {
  // Em produção, salvar mensagem no banco e notificar usuários via WebSocket
  console.log("New message received from handler:", data.data)
  broadcast({
    event: 'new_message',
    data: data.data // ou o que for necessário para o frontend
  });
  // Aqui você pode:
  // 1. Salvar a mensagem no banco de dados
  // 2. Determinar qual agente deve receber a notificação
  // 3. Enviar notificação em tempo real via WebSocket
  // 4. Atualizar estatísticas
}

async function handleStatusUpdate(data: any) {
  console.log("Status update:", data)
  // Atualizar status da mensagem (enviada, entregue, lida)
}

async function handleConnectionUpdate(data: any) {
  console.log("Connection update:", data)
  // Atualizar status da conexão da instância
}