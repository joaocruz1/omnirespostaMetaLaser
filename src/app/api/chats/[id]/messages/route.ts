// src/app/api/chats/[id]/messages/route.ts

import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import { type NextRequest, NextResponse } from "next/server";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni";

// Tipos para facilitar o entendimento do código
type RawMessage = {
  key: {
    id: string;
    fromMe: boolean;
  };
  messageTimestamp: number;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { caption?: string };
    audioMessage?: object;
    videoMessage?: { caption?: string };
    stickerMessage?: object;
    documentMessage?: { caption?: string };
    reactionMessage?: { text: string };
  };
};

type RouterContext = {
  params : Promise<{id: string}>
}

// Assinatura da função no padrão recomendado pelo Next.js
export async function GET(
  request: Request, 
  context : RouterContext
): Promise<NextResponse> {
  
  const params = await context.params;
  const chatId = params.id;


  try {
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID é obrigatório" }, { status: 400 });
    }

    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findMessages/${INSTANCE_NAME}`, {
        method: 'POST',
        headers: {
            "apikey": EVOLUTION_API_KEY || "",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "jid": chatId,
            "limit": 100 // Aumente se precisar de mais histórico
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Falha ao buscar mensagens da API Evolution:", errorText);
        return NextResponse.json({
          error: "Falha ao buscar mensagens da API Evolution",
          details: errorText
        }, { status: response.status });
    }

    const apiResponse = await response.json();

    // --- CORREÇÃO DEFINITIVA APLICADA AQUI ---
    // Acessamos o array de mensagens que está dentro de 'messages.records'
    const messagesArray: RawMessage[] = apiResponse?.messages?.records;

    // Verificamos se o caminho até o array existe e se é de fato um array
    if (!Array.isArray(messagesArray)) {
      console.error("A resposta da API não continha um array em 'messages.records'. Resposta recebida:", apiResponse);
      return NextResponse.json(
        { error: "Formato de resposta inesperado da API externa." },
        { status: 500 }
      );
    }
    
    // Ordena as mensagens por timestamp (da mais antiga para a mais nova)
    const sortedMessages = [...messagesArray].sort(
      (a, b) => a.messageTimestamp - b.messageTimestamp
    );

    // Formata as mensagens para o formato que o frontend espera
    const formattedMessages = sortedMessages.map(msg => {
      let content = "[Mensagem não suportada]";
      let type: "text" | "image" | "audio" | "document" | "location" = "text";

      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
      } else if (msg.message?.imageMessage) {
        content = msg.message.imageMessage.caption || "[Imagem]";
        type = "image";
      } else if (msg.message?.audioMessage) {
        content = "[Áudio]";
        type = "audio";
      } else if (msg.message?.videoMessage) {
        content = msg.message.videoMessage.caption || "[Vídeo]";
        type = "document";
      } else if (msg.message?.stickerMessage) {
        content = "[Figurinha]";
        type = "image";
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
        timestamp: new Date(msg.messageTimestamp * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
      };
    });

    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error("Falha ao processar a requisição de mensagens:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro interno no servidor", details: errorMessage }, { status: 500 });
  }
}