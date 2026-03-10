import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { ApiResponse, UserProfile } from "@xpr-quests/shared";

export function useProfile(name: string | null) {
  return useSWR<ApiResponse<UserProfile>>(
    name ? `/api/profile/${name}` : null,
    fetcher,
    { refreshInterval: 30000 },
  );
}
