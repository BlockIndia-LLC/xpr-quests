import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { LeaderboardEntry } from "@xpr-quests/shared";

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

export function useLeaderboard(filters: {
  type: "alltime" | "season" | "skill";
  season_id?: number;
  skill_tree?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  params.set("type", filters.type);
  if (filters.season_id) params.set("season_id", String(filters.season_id));
  if (filters.skill_tree) params.set("skill_tree", filters.skill_tree);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  return useSWR<LeaderboardResponse>(
    `/api/leaderboard?${params.toString()}`,
    fetcher,
    { refreshInterval: 30000 },
  );
}
