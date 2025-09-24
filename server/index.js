// Simple WebSocket signaling server with room support (ESM)
// Usage: SIGNALING_PORT=3001 node server/index.js

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const port = Number(process.env.SIGNALING_PORT || 3001);

/** @type {Map<string, Set<WebSocket>>} */
const roomIdToClients = new Map();
/** @type {WeakMap<WebSocket, { roomId: string, id: string, name: string }>} */
const clientMeta = new WeakMap();

function broadcast(roomId, message, exceptClient) {
    const clients = roomIdToClients.get(roomId);
    if (!clients) return;
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN && client !== exceptClient) {
            client.send(JSON.stringify(message));
        }
    }
}

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(String(data));
        } catch {
            return;
        }

        const { type, room, from, to, payload } = msg || {};
        if (!room || !type) return;

        if (type === 'join') {
            const meta = { roomId: room, id: from, name: payload?.name || '' };
            clientMeta.set(ws, meta);
            if (!roomIdToClients.has(room)) roomIdToClients.set(room, new Set());
            roomIdToClients.get(room).add(ws);

            // Notify the new client about currently connected peers
            const peers = [];
            for (const client of roomIdToClients.get(room)) {
                if (client !== ws) {
                    const m = clientMeta.get(client);
                    if (m) peers.push({ id: m.id, name: m.name });
                }
            }
            ws.send(JSON.stringify({ type: 'peers', payload: { peers } }));

            // Broadcast to others that a participant joined
            broadcast(room, { type: 'join', payload: { from, name: meta.name } }, ws);
            return;
        }

        // Relay targeted messages
        if (to) {
            const clients = roomIdToClients.get(room);
            if (!clients) return;
            for (const client of clients) {
                const m = clientMeta.get(client);
                if (m && m.id === to && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type, payload: { ...payload, from } }));
                    break;
                }
            }
            return;
        }

        // Broadcast room-wide messages
        broadcast(room, { type, payload: { ...payload, from } }, ws);
    });

    ws.on('close', () => {
        const meta = clientMeta.get(ws);
        if (!meta) return;
        const { roomId, id } = meta;
        const clients = roomIdToClients.get(roomId);
        if (clients) {
            clients.delete(ws);
            if (clients.size === 0) roomIdToClients.delete(roomId);
        }
        broadcast(roomId, { type: 'leave', payload: { from: id } }, ws);
        clientMeta.delete(ws);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`[signaling] listening on ws://localhost:${port}/ws`);
});

