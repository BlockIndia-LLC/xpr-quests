import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { WsEvent } from "@xpr-quests/shared";

const clients = new Map<string, Set<WebSocket>>();

export function startWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const account = url.searchParams.get("account");

    if (!account) {
      ws.close(1008, "Account parameter required");
      return;
    }

    // Track client by account name
    if (!clients.has(account)) {
      clients.set(account, new Set());
    }
    clients.get(account)!.add(ws);

    console.log(`[WS] Client connected: ${account}`);

    ws.on("close", () => {
      clients.get(account)?.delete(ws);
      if (clients.get(account)?.size === 0) {
        clients.delete(account);
      }
      console.log(`[WS] Client disconnected: ${account}`);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Error for ${account}:`, err.message);
    });

    // Heartbeat ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30_000);

    ws.on("close", () => clearInterval(pingInterval));
  });

  console.log("[WS] WebSocket server started");
}

export function broadcastToUser(account: string, event: WsEvent): void {
  const sockets = clients.get(account);
  if (!sockets) return;

  const message = JSON.stringify(event);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function broadcastToAll(event: WsEvent): void {
  const message = JSON.stringify(event);
  for (const sockets of clients.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}
