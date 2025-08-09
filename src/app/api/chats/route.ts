import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const chats = await prisma.chat.findMany({
      include: {
        contact: true,
        assignedTo: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    const formatted = chats.map((chat) => ({
      id: chat.id,
      contact: chat.contact,
      lastMessage: chat.lastMessage || '',
      timestamp: chat.lastMessageAt ? chat.lastMessageAt.toISOString() : '',
      unreadCount: chat.unreadMessages,
      assignedTo: chat.assignedTo ? chat.assignedTo.name : undefined,
      status:
        chat.status === 'OPEN'
          ? 'active'
          : chat.status === 'PENDING'
            ? 'waiting'
            : 'closed',
      profilePicUrl: null,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Failed to load chats', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
