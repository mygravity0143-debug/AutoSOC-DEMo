import { WebSocketServer, WebSocket } from 'ws';

class SocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  init(server: any) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[WebSocket] Client connected. Total active clients: ${this.clients.size}`);

      // Send initial welcome message
      ws.send(JSON.stringify({
        type: 'CONNECTION_ACK',
        data: { message: 'AutoSOC WebSocket Connected', timestamp: new Date().toISOString() }
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Remaining: ${this.clients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WebSocket] Client error:', err);
      });
    });
  }

  broadcast(type: string, data: any) {
    const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  getActiveClientsCount(): number {
    return this.clients.size;
  }
}

export const socketManager = new SocketManager();
