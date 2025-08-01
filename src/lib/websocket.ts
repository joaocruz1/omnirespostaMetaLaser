// src/lib/websocket.ts
import { WebSocketServer, WebSocket } from 'ws';

// Declara um servidor WebSocket no escopo global para persistir entre recargas de módulos do Next.js
declare global {
  var _wss: WebSocketServer | undefined;
}

const wss = global._wss || new WebSocketServer({ noServer: true });
global._wss = wss;

console.log("WebSocket Server inicializado.");

wss.on('connection', ws => {
  console.log('Cliente conectado ao WebSocket.');
  ws.on('close', () => {
    console.log('Cliente desconectado do WebSocket.');
  });
});

export const broadcast = (data: any) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

export default wss;