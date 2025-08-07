import { NextResponse } from "next/server";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni";

type RawMessage = {
  key: {
    id: string;
    fromMe: boolean;
  };
  messageTimestamp: number;
  // O status é opcional, pois a API de histórico pode não fornecê-lo.
  status?: "ERROR" | "PENDING" | "SERVER_ACK" | "DELIVERY_ACK" | "READ" | "PLAYED";
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

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const chatId = params.id;
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") || "1");
  const limit = Number.parseInt(url.searchParams.get("limit") || "50");

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
        limit: limit,
        offset: (page - 1) * limit,
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
        { status: response.status },
      );
    }

    const apiResponse = await response.json();
    const messagesArray: RawMessage[] = apiResponse?.messages?.records;

    if (!Array.isArray(messagesArray)) {
      console.error("A resposta da API não continha um array em 'messages.records'. Resposta recebida:", apiResponse);
      return NextResponse.json({ error: "Formato de resposta inesperado da API externa." }, { status: 500 });
    }

    const sortedMessages = [...messagesArray].sort((a, b) => a.messageTimestamp - b.messageTimestamp);

    const formattedMessages = sortedMessages.map((msg) => {
      let content = "[Mensagem não suportada]";
      let type: "text" | "image" | "audio" | "document" | "location" | "video" = "text";

      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage) {
        type = "image";
        content = msg.message.imageMessage.caption || "";
      } else if (msg.message?.audioMessage) {
        content = "";
        type = "audio";
      } else if (msg.message?.videoMessage) {
        content = msg.message.videoMessage.caption || "[Vídeo]";
        type = "video";
      } else if (msg.message?.stickerMessage) {
        type = "image";
        content = "";
      } else if (msg.message?.documentMessage) {
        content = msg.message.documentMessage.caption || "[Documento]";
        type = "document";
      } else if (msg.message?.reactionMessage) {
        content = `[Reação: ${msg.message.reactionMessage.text}]`;
      }
      
      return {
        id: msg.key.id,
        content: content,
        type: type,
        sender: msg.key.fromMe ? "agent" : "customer",
        status: msg.status, // Será undefined se não vier da API, o que é esperado.
        timestamp: new Date(msg.messageTimestamp * 1000).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        hasMedia: type !== "text",
      };
    });

    return NextResponse.json({
      messages: formattedMessages,
      hasMore: messagesArray.length === limit,
      currentPage: page,
    });
  } catch (error) {
    console.error("Falha ao processar a requisição de mensagens:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro interno no servidor", details: errorMessage }, { status: 500 });
  }
}
