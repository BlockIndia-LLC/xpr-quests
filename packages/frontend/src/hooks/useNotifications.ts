import useSWR from "swr";
import { fetcher, apiFetch } from "@/lib/api";
import type { ApiResponse, Notification } from "@xpr-quests/shared";

interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unread_count: number;
}

export function useNotifications() {
  return useSWR<NotificationsResponse>("/api/notifications", fetcher, {
    refreshInterval: 30000,
  });
}

export async function markNotificationsRead(ids?: number[]) {
  return apiFetch<ApiResponse<null>>("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify(ids ? { ids } : {}),
  });
}
