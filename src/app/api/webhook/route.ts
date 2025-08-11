import { type NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

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
      // Persistência de novos contatos/chats ao receber mensagens
      if (webhookData.event === "messages.upsert" && Array.isArray(webhookData.data?.messages)) {
        for (const msg of webhookData.data.messages) {
          const remoteJid = msg.key?.remoteJid;
          if (!remoteJid) continue;

          const contactId = remoteJid.split("@")[0];

          // Garante que o contato exista no banco
          await prisma.contact.upsert({
            where: { id: contactId },
            update: {},
            create: { id: contactId },
          });

          // Determina uma representação textual da última mensagem
          let lastMessage = "[Mensagem não suportada]";
          const messageContent = msg.message;
          if (messageContent?.conversation) {
            lastMessage = messageContent.conversation;
          } else if (messageContent?.extendedTextMessage?.text) {
            lastMessage = messageContent.extendedTextMessage.text;
          } else if (messageContent?.reactionMessage) {
            lastMessage = `[Reação: ${messageContent.reactionMessage.text}]`;
          } else if (messageContent?.stickerMessage) {
            lastMessage = "[Figurinha]";
          } else if (messageContent?.imageMessage) {
            lastMessage = "[Imagem]";
          } else if (messageContent?.audioMessage) {
            lastMessage = "[Áudio]";
          } else if (messageContent?.videoMessage) {
            lastMessage = "[Vídeo]";
          } else if (messageContent?.documentMessage) {
            lastMessage = "[Documento]";
          }

          const timestamp = msg.messageTimestamp
            ? new Date(msg.messageTimestamp * 1000)
            : new Date();

          await prisma.chat.upsert({
            where: { id: remoteJid },
            update: { lastMessage, timestamp },
            create: {
              id: remoteJid,
              lastMessage,
              timestamp,
              contact: { connect: { id: contactId } },
            },
          });
        }
      }

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
        const payload = {
          event: webhookData.event,
          chatId: webhookData.data?.key?.remoteJid || webhookData.data?.id,
          timestamp: new Date().toISOString()
        };
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
