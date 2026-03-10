"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSWRConfig } from "swr";
import { WS_URL } from "@/lib/constants";
import type { WsEvent } from "@xpr-quests/shared";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 2000;

export function useWebSocket(account: string | null) {
  const { mutate } = useSWRConfig();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!account) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?account=${account}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        if (data.data.quest_id) {
          mutate(`/api/quests/${data.data.quest_id}`);
        }
        mutate(`/api/profile/${account}`);
        mutate(
          (key: string) =>
            typeof key === "string" && key.startsWith("/api/quests"),
          undefined,
          { revalidate: true },
        );
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay =
          BASE_RECONNECT_DELAY_MS *
          Math.pow(2, reconnectAttempts.current);
        console.log(
          `[WS] Disconnected. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})...`,
        );
        reconnectAttempts.current += 1;
        reconnectTimer.current = setTimeout(connect, delay);
      } else {
        console.warn(
          "[WS] Max reconnection attempts reached. WebSocket disabled.",
        );
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      ws.close();
    };
  }, [account, mutate]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      reconnectAttempts.current = 0;
    };
  }, [connect]);
}
