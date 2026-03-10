import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { PaginatedResponse, Quest } from "@xpr-quests/shared";

export function useQuests(filters?: {
  skill_tree?: string;
  season_id?: number;
  status?: number;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.skill_tree) params.set("skill_tree", filters.skill_tree);
  if (filters?.season_id) params.set("season_id", String(filters.season_id));
  if (filters?.status !== undefined)
    params.set("status", String(filters.status));
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));

  const queryString = params.toString();
  const path = `/api/quests${queryString ? `?${queryString}` : ""}`;

  return useSWR<PaginatedResponse<Quest>>(path, fetcher, {
    refreshInterval: 30000,
  });
}
