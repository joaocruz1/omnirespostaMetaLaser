import { type NextRequest, NextResponse } from "next/server";
import { pusherServer } from '@/lib/pusher';

// Lista de eventos que devem acionar uma atualização no frontend.
// Adicione ou remova eventos conforme sua necessidade.
const RELEVANT_EVENTS = [
  "messages.upsert",
  "contacts.update",
  "chats.update",
  "chats.delete",
  "connection.update",
  // Adicione aqui outros eventos da Evolution API que você queira que atualizem a UI
];

export async function POST(request: NextRequest) {
  try {
    // 1. Recebe os dados do webhook da Evolution API
    const webhookData = await request.json();

    // 2. Verifica se o evento recebido é um dos que nos interessam
    if (RELEVANT_EVENTS.includes(webhookData.event)) {
      
      // 3. Define o canal e o nome do evento para o Pusher
      const channelName = 'chat-updates'; 
      const eventName = 'chat-event'; 

      // 4. Cria um payload menor para enviar ao Pusher, evitando o erro de "Payload Too Large"
      const payload = {
        event: webhookData.event,
        // Você pode enviar outros dados pequenos se forem úteis, como o ID do chat
        chatId: webhookData.data?.key?.remoteJid || webhookData.data?.id,
        // Adicionando um timestamp para referência 
        timestamp: new Date().toISOString()
      };

      // 5. Dispara o evento para o Pusher com o payload reduzido
      await pusherServer.trigger(channelName, eventName, payload);

      // Log para confirmar que o evento foi enviado (útil para depuração)
      console.log(`Pusher event '${eventName}' triggered on channel '${channelName}' for Evolution event '${webhookData.event}'`);
    } else {
      // Opcional: Logar eventos que não estamos tratando
      console.log(`Ignored webhook event: ${webhookData.event}`);
    }

    // 6. Responde à Evolution API com sucesso
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}