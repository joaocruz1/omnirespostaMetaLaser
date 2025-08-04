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
      // Usamos um canal único para todas as atualizações relacionadas ao chat.
      const channelName = 'chat-updates'; 
      // O nome do evento pode ser genérico, já que os dados contém o tipo de evento original.
      const eventName = 'chat-event'; 

      // 4. Dispara o evento para o Pusher com todos os dados do webhook
      // O frontend receberá 'webhookData' completo e poderá decidir o que fazer.
      await pusherServer.trigger(channelName, eventName, webhookData);

      // Log para confirmar que o evento foi enviado (útil para depuração)
      console.log(`Pusher event '${eventName}' triggered on channel '${channelName}' for Evolution event '${webhookData.event}'`);
    } else {
      // Opcional: Logar eventos que não estamos tratando
      console.log(`Ignored webhook event: ${webhookData.event}`);
    }

    // 5. Responde à Evolution API com sucesso
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
