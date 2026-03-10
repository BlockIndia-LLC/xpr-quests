"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSWRConfig } from "swr";
import { WS_URL } from "@/lib/constants";
import { useToastStore } from "@/stores/toastStore";
import type { WsEvent } from "@xpr-quests/shared";

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 2000;

export function useWebSocket(account: string | null) {
  const { mutate } = useSWRConfig();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

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
        const addToast = useToastStore.getState().addToast;

        // Revalidate related SWR caches
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
        mutate(
          (key: string) =>
            typeof key === "string" && key.startsWith("/api/skill-trees"),
          undefined,
          { revalidate: true },
        );
        mutate(
          (key: string) =>
            typeof key === "string" && key.startsWith("/api/leaderboard"),
          undefined,
          { revalidate: true },
        );

        // Trigger toasts based on event type
        switch (data.type) {
          case "quest_complete":
            addToast({
              type: "success",
              message: "Quest Completed!",
              description: data.data.xp_awarded
                ? `+${data.data.xp_awarded} XP earned`
                : undefined,
            });
            break;

          case "level_up":
            addToast({
              type: "success",
              message: `Level Up! You are now level ${data.data.new_level}`,
            });
            if (data.data.new_level) {
              setLevelUp(data.data.new_level);
            }
            break;

          case "tier_up":
            addToast({
              type: "success",
              message: "Tier Promotion!",
              description: "You've reached a new tier rank",
            });
            break;

          case "title_earned":
            addToast({
              type: "success",
              message: "Soulbound Title Earned!",
              description: data.data.title
                ? `"${data.data.title}" has been added to your profile`
                : undefined,
            });
            break;

          case "quest_progress":
            addToast({
              type: "info",
              message: "Quest Progress",
              description:
                data.data.current_count && data.data.required_count
                  ? `${data.data.current_count}/${data.data.required_count} completed`
                  : undefined,
            });
            break;
        }
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

  return { levelUp, clearLevelUp: () => setLevelUp(null) };
}
