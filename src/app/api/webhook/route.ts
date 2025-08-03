// src/app/api/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { broadcast } from '@/lib/websocket';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()
    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      // --- ALTERAÇÃO AQUI ---
      // Tratar tanto 'messages.upsert' quanto 'contacts.update' como um gatilho para atualizar os chats
      case "messages.upsert":
      case "contacts.update": // Adicionado para tratar a atualização de contatos
        await handleNewMessage(webhookData)
        break
      
      case "chats.update":
        broadcast({ event: 'chat_update', data: webhookData.data });
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
  console.log("New message/update event received from handler:", data.data)
  // Notifica o frontend para recarregar a lista de chats
  broadcast({
    event: 'new_message',
    data: data.data
  });
}

async function handleStatusUpdate(data: any) {
  console.log("Status update:", data)
  // Atualizar status da mensagem (enviada, entregue, lida)
}

async function handleConnectionUpdate(data: any) {
  
  // Atualizar status da conexão da instância
}