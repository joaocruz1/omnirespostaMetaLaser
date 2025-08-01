// src/app/api/ws/route.ts
import { NextResponse } from 'next/server';
import wss from '@/lib/websocket';

export async function GET(request: Request) {
  // Este endpoint é mais para confirmação. A mágica acontece no servidor.
  // Para um ambiente de produção real, você precisará de um custom server no Next.js
  // ou um serviço de WebSocket separado.
  return new NextResponse('WebSocket endpoint ready', { status: 200 });
}

// Precisamos de um custom server para lidar com o upgrade de WebSocket em produção.
// Para desenvolvimento (npm run dev), o servidor de desenvolvimento pode ser estendido.
// Esta é uma limitação conhecida das API Routes do Next.js.
// Uma solução mais robusta para produção seria usar um serviço como o Pusher ou Ably,
// ou configurar um servidor Node.js personalizado.