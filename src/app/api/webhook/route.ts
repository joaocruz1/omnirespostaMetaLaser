import { type NextRequest, NextResponse } from "next/server";
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

// Lista de eventos que devem acionar uma atualização no frontend.
const RELEVANT_EVENTS = [
  "messages.upsert",
  "messages.update", // Evento para atualização de status
  "contacts.update",
  "chats.update",
  "chats.delete",
  "connection.update",
];

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    if (RELEVANT_EVENTS.includes(webhookData.event)) {
      const channelName = 'chat-updates';

      // Lógica específica para o evento de atualização de status da mensagem
      if (webhookData.event === "messages.update") {
        const eventName = 'message-status-update';
        
        // O `data` para `messages.update` é um array, então iteramos sobre ele
        if (Array.isArray(webhookData.data)) {
          for (const update of webhookData.data) {
            // Verificação de segurança para garantir que a estrutura de dados é a esperada
            if (update.key && update.key.id && update.update && update.update.status) {
              const payload = {
                id: update.key.id,
                status: update.update.status,
                chatId: update.key.remoteJid,
              };
              // Dispara um evento para cada atualização de status
              await pusherServer.trigger(channelName, eventName, payload);
              console.log(`Pusher event '${eventName}' triggered for message ${payload.id} with status ${payload.status}`);
            }
          }
        }
      } else {
        // Lógica para os outros eventos
        const eventName = 'chat-event';
        let payload: any = {
          event: webhookData.event,
          chatId: webhookData.data?.key?.remoteJid || webhookData.data?.id,
          timestamp: new Date().toISOString()
        };

        // Para mensagens novas, incluir informações da mensagem
        if (webhookData.event === "messages.upsert" && webhookData.data?.messages?.[0]) {
          const message = webhookData.data.messages[0];
          const isIncoming = !message.key.fromMe;
          const chatId = message.key.remoteJid;
          
          // Extrair conteúdo da mensagem
          let messageContent = "[Mídia]";
          if (message.message?.conversation) {
            messageContent = message.message.conversation;
          } else if (message.message?.extendedTextMessage?.text) {
            messageContent = message.message.extendedTextMessage.text;
          } else if (message.message?.imageMessage) {
            messageContent = message.message.imageMessage.caption || "[Imagem]";
          } else if (message.message?.audioMessage) {
            messageContent = "[Áudio]";
          } else if (message.message?.videoMessage) {
            messageContent = message.message.videoMessage.caption || "[Vídeo]";
          } else if (message.message?.documentMessage) {
            messageContent = message.message.documentMessage.caption || "[Documento]";
          } else if (message.message?.stickerMessage) {
            messageContent = "[Figurinha]";
          }

          // Atualizar apenas o contador de mensagens não lidas no banco (não a última mensagem)
          try {
            if (isIncoming) {
              await prisma.chat.updateMany({
                where: { id: chatId },
                data: {
                  unreadCount: {
                    increment: 1
                  }
                }
              });
            }
            console.log(`Contador atualizado para chat ${chatId}: ${messageContent} (${isIncoming ? 'recebida' : 'enviada'})`);
          } catch (error) {
            console.error(`Erro ao atualizar contador para chat ${chatId}:`, error);
          }

          payload = {
            ...payload,
            message: {
              content: messageContent,
              isIncoming,
              timestamp: message.messageTimestamp,
              sender: isIncoming ? "customer" : "agent"
            }
          };
        }

        await pusherServer.trigger(channelName, eventName, payload);
        console.log(`Pusher event '${eventName}' triggered on channel '${channelName}' for Evolution event '${webhookData.event}'`);
      }
    } else {
      console.log(`Ignored webhook event: ${webhookData.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
  }
}
