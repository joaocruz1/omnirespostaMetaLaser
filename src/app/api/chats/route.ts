// src/app/api/chats/route.ts

import { type NextRequest, NextResponse } from "next/server"

const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL || "http://localhost:8080"
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE_NAME = process.env.INSTANCE_NAME || "joaoomni"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${EVOLUTION_API_BASE_URL}/chat/findChats/${INSTANCE_NAME}`, {
      method: "POST", 
      headers: {
        "apikey": EVOLUTION_API_KEY || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Erro da API Evolution:", errorBody);
      throw new Error("Falha ao buscar conversas da API Evolution")
    }

    const rawChats = await response.json()

    // Para depuração: veja exatamente o que a API está enviando no seu terminal
    console.log("Resposta crua da API de chats:", JSON.stringify(rawChats, null, 2));

    // --- ALTERAÇÃO PRINCIPAL AQUI ---
    // 1. Primeiro, filtre a lista para manter apenas os chats que têm um 'jid'.
    //    Isso evita o erro 'cannot read properties of undefined'.
    const validChats = Array.isArray(rawChats) 
      ? rawChats.filter((chat: any) => chat && typeof chat.jid === 'string')
      : [];
      
    // 2. Agora, mapeie apenas os chats válidos.
    const formattedChats = validChats.map((chat: any) => {
      const contactName = chat.name || chat.jid.split('@')[0];
      
      let lastMessageText = "[Sem mensagens]";
      if (chat.lastMessage && chat.lastMessage.message) {
        lastMessageText = chat.lastMessage.message?.extendedTextMessage?.text || 
                          chat.lastMessage.message?.conversation || 
                          `[Tipo de mensagem não suportado]`;
      }
      
      // Garante que o timestamp 't' existe antes de usá-lo
      const timestamp = chat.t ? new Date(chat.t * 1000).toLocaleString('pt-BR') : 'Sem data';

      return {
        id: chat.jid,
        contact: contactName,
        lastMessage: lastMessageText,
        timestamp: timestamp,
        unreadCount: chat.unreadCount || 0,
        assignedTo: "N/A",
        status: "active",
      };
    });

    return NextResponse.json(formattedChats);

  } catch (error) {
    console.error("Falha ao buscar conversas:", error)
    // Retorna o erro real no corpo da resposta para facilitar a depuração no frontend
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: "Erro ao buscar conversas", details: errorMessage }, { status: 500 })
  }
}