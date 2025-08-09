import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { name },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Failed to update contact', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
