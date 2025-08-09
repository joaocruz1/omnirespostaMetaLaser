import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedChat = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        assignedToId: userId,
      },
      include: {
        contact: true,
        assignedTo: true,
      },
    });

    await pusherServer.trigger('chats', 'chat:update', updatedChat);

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Failed to transfer chat', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
