// src/app/api/chats/[id]/messages/route.ts

import { type NextRequest, NextResponse } from "next/server";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni";

type RawMessage = {
  key: {
    id: string;
    fromMe: boolean;
  };
  messageTimestamp: number;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string; mimetype?: string };
    audioMessage?: { mimetype?: string };
    videoMessage?: { caption?: string; mimetype?: string };
    stickerMessage?: object;
    documentMessage?: { caption?: string; mimetype?: string };
    reactionMessage?: { text: string };
  };
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const params = await context.params;
  const chatId = params.id;

  try {
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID é obrigatório" }, { status: 400 });
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (EVOLUTION_API_KEY) {
      headers["apikey"] = EVOLUTION_API_KEY;
    }

    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findMessages/${INSTANCE_NAME}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: chatId,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Falha ao buscar mensagens da API Evolution:", errorText);
      return NextResponse.json(
        {
          error: "Falha ao buscar mensagens da API Evolution",
          details: errorText,
        },
        { status: response.status }
      );
    }

    const apiResponse = await response.json();
    const messagesArray: RawMessage[] = apiResponse?.messages?.records;

    if (!Array.isArray(messagesArray)) {
      console.error("A resposta da API não continha um array em 'messages.records'. Resposta recebida:", apiResponse);
      return NextResponse.json(
        { error: "Formato de resposta inesperado da API externa." },
        { status: 500 }
      );
    }

    const sortedMessages = [...messagesArray].sort(
      (a, b) => a.messageTimestamp - b.messageTimestamp
    );

    const formattedMessagesPromises = sortedMessages.map(async (msg) => {
      let content = "[Mensagem não suportada]";
      let type: "text" | "image" | "audio" | "document" | "location" | "video" = "text";
      let mediaUrl: string | undefined = undefined;

      const getMediaAsDataUrl = async (messageData: object, isVideo: boolean = false) => {
        try {
          const mediaHeaders: HeadersInit = {
            "Content-Type": "application/json",
          };
          if (EVOLUTION_API_KEY) {
            mediaHeaders["apikey"] = EVOLUTION_API_KEY;
          }

          const bodyData = {
            message: messageData,
            ...(isVideo ? { convertToMp4: true } : {}),
          };

          const mediaResponse = await fetch(`${EVOLUTION_API_BASE_URL}/chat/getBase64FromMediaMessage`, {
            method: "POST",
            headers: mediaHeaders,
            body: JSON.stringify(bodyData),
          });

          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData?.mimetype && mediaData?.base64) {
              return `data:${mediaData.mimetype};base64,${mediaData.base64}`;
            }
          }
        } catch (e) {
          console.error("Erro ao buscar mídia da mensagem:", e);
        }
        return undefined;
      };

      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage) {
        content = msg.message.imageMessage.caption || "";
        type = "image";
        mediaUrl = await getMediaAsDataUrl({ key: msg.key, message: msg.message });
      } else if (msg.message?.audioMessage) {
        content = "";
        type = "audio";
        mediaUrl = await getMediaAsDataUrl({ key: msg.key, message: msg.message });
      } else if (msg.message?.videoMessage) {
        content = msg.message.videoMessage.caption || "[Vídeo]";
        type = "video"; // <- mudou de "document" para "video"
        mediaUrl = await getMediaAsDataUrl({ key: msg.key, message: msg.message }, true);
      } else if (msg.message?.stickerMessage) {
        content = "[Figurinha]";
        type = "image";
        mediaUrl = await getMediaAsDataUrl({ key: msg.key, message: msg.message });
      } else if (msg.message?.documentMessage) {
        content = msg.message.documentMessage.caption || "[Documento]";
        type = "document";
        mediaUrl = await getMediaAsDataUrl({ key: msg.key, message: msg.message });
      } else if (msg.message?.reactionMessage) {
        content = `[Reação: ${msg.message.reactionMessage.text}]`;
      }

      return {
        id: msg.key.id,
        content: content,
        type: type,
        sender: msg.key.fromMe ? "agent" : "customer",
        timestamp: new Date(msg.messageTimestamp * 1000).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mediaUrl: mediaUrl,
      };
    });

    const formattedMessages = await Promise.all(formattedMessagesPromises);
    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error("Falha ao processar a requisição de mensagens:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro interno no servidor", details: errorMessage }, { status: 500 });
  }
}
