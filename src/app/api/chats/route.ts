// src/app/api/chats/route.ts

import { type NextRequest, NextResponse } from "next/server";

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni";

export async function GET(request: NextRequest) {
  try {
    // A API da Evolution usa POST para buscar os chats, mesmo sendo uma operação de busca
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findChats/${INSTANCE_NAME}`, {
      method: "POST", // Mantendo POST conforme a documentação da Evolution
      headers: {
        "apikey": EVOLUTION_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro da API Evolution:", errorBody);
      throw new Error("Falha ao buscar conversas da API Evolution");
    }

    const rawChats = await response.json();

    // Para depuração: veja exatamente o que a API está enviando no seu terminal
    // console.log("Resposta crua da API de chats:", JSON.stringify(rawChats, null, 2));

    // --- CORREÇÃO PRINCIPAL AQUI ---
    // 1. Filtra a lista para manter apenas os chats que têm um 'remoteJid'.
    const validChats = Array.isArray(rawChats) 
      ? rawChats.filter((chat: any) => chat && typeof chat.remoteJid === 'string')
      : [];
      
    // 2. Mapeia os chats válidos para o formato que o frontend espera.
    const formattedChats = validChats.map((chat: any) => {
      // Usa o pushName ou, como fallback, o número do JID.
      const contactName = chat.pushName || chat.remoteJid.split('@')[0];
      
      let lastMessageText = "[Sem mensagens]";
      // Extrai o texto da última mensagem de forma mais robusta
      if (chat.lastMessage && chat.lastMessage.message) {
        lastMessageText = 
            chat.lastMessage.message.conversation ||
            chat.lastMessage.message.extendedTextMessage?.text ||
            (chat.lastMessage.message.reactionMessage ? `[Reação: ${chat.lastMessage.message.reactionMessage.text}]` : '') ||
            (chat.lastMessage.message.stickerMessage ? '[Figurinha]' : '') ||
            (chat.lastMessage.message.imageMessage ? '[Imagem]' : '') ||
            (chat.lastMessage.message.audioMessage ? '[Áudio]' : '') ||
            `[Tipo de mensagem não suportado]`;
      }
      
      // Usa o timestamp da última mensagem, que é mais relevante.
      const timestamp = chat.lastMessage?.messageTimestamp 
          ? new Date(chat.lastMessage.messageTimestamp * 1000).toLocaleString('pt-BR') 
          : new Date(chat.updatedAt).toLocaleString('pt-BR');

      return {
        id: chat.remoteJid, // CORRIGIDO: de chat.jid para chat.remoteJid
        contact: contactName, // CORRIGIDO: usando pushName
        lastMessage: lastMessageText, // Lógica melhorada
        timestamp: timestamp, // CORRIGIDO: usando messageTimestamp
        unreadCount: chat.unreadCount || 0,
        // Estes campos podem ser preenchidos com lógica de banco de dados no futuro
        assignedTo: "N/A", 
        status: "active", // Hardcoded por enquanto
      };
    });

    return NextResponse.json(formattedChats);

  } catch (error) {
    console.error("Falha ao buscar conversas:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao buscar conversas", details: errorMessage }, { status: 500 });
  }
}