import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, instance } = body;
    const { id, from, type, body: messageBody, fromMe, t: timestamp, status } = data;

    const contactNumber = from.split('@')[0];

    let contact = await prisma.contact.findUnique({
      where: { number: contactNumber },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          number: contactNumber,
          name: data.pushName || contactNumber,
        },
      });
    }

    let chat = await prisma.chat.findFirst({
      where: { contactId: contact.id },
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          contactId: contact.id,
          lastMessage: messageBody,
          lastMessageAt: new Date(timestamp * 1000),
        },
      });
    } else {
      chat = await prisma.chat.update({
        where: { id: chat.id },
        data: {
          lastMessage: messageBody,
          lastMessageAt: new Date(timestamp * 1000),
          status: 'OPEN',
          unreadMessages: {
            increment: fromMe ? 0 : 1,
          },
        },
      });
    }

    await prisma.message.create({
      data: {
        id: id,
        chatId: chat.id,
        content: messageBody,
        fromMe: fromMe,
        timestamp: new Date(timestamp * 1000),
        type: type,
        status: status,
      },
    });

    await pusherServer.trigger('chats', 'chat:update', {
      instance,
      chatId: chat.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
