import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { unreadCount, status } = await request.json();
    const chatId = id;

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
      },
      include: { contact: true }
    });

    // Disparar evento Pusher para notificar o frontend sobre a atualização
    try {
      await pusherServer.trigger('chat-updates', 'chat-event', {
        event: 'chats.update',
        chatId: chatId,
        chat: updatedChat,
        timestamp: new Date().toISOString()
      });
      console.log(`Pusher event triggered for chat status update: ${chatId}`);
    } catch (pusherError) {
      console.error("Erro ao disparar evento Pusher:", pusherError);
      // Não falhar a operação se o Pusher falhar
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Erro ao atualizar status do chat:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do chat" },
      { status: 500 }
    );
  }
}
