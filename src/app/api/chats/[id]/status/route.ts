import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { unreadCount, status } = await request.json();
    const chatId = params.id;

    // Verificar se o chat existe
    const existingChat = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!existingChat) {
      return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 });
    }

    // Atualizar o chat
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        ...(unreadCount !== undefined && { unreadCount }),
        ...(status !== undefined && { status }),
        timestamp: new Date()
      }
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Erro ao atualizar status do chat:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do chat" },
      { status: 500 }
    );
  }
}
