import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { ApiResponse, Season } from "@xpr-quests/shared";

export function useSeasons() {
  return useSWR<ApiResponse<Season[]>>("/api/seasons", fetcher, {
    refreshInterval: 60000,
  });
}

export function useSeason(id: number | null) {
  return useSWR<ApiResponse<Season>>(
    id ? `/api/seasons/${id}` : null,
    fetcher,
    { refreshInterval: 60000 },
  );
}
