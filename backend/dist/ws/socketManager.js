"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketManager = void 0;
const ws_1 = require("ws");
class SocketManager {
    wss = null;
    clients = new Set();
    init(server) {
        this.wss = new ws_1.WebSocketServer({ server, path: '/ws' });
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
    broadcast(type, data) {
        const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        for (const client of this.clients) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(payload);
            }
        }
    }
    getActiveClientsCount() {
        return this.clients.size;
    }
}
exports.socketManager = new SocketManager();
