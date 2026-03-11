import useSWR from "swr";
import { fetcher, apiFetch } from "@/lib/api";
import type { ApiResponse, Perk, Redemption } from "@xpr-quests/shared";

export function usePerks() {
  return useSWR<ApiResponse<Perk[]>>("/api/perks", fetcher, {
    refreshInterval: 60000,
  });
}

export function useRedemptionHistory() {
  return useSWR<ApiResponse<Redemption[]>>("/api/perks/history", fetcher);
}

export async function redeemPerk(perkId: number) {
  return apiFetch<ApiResponse<{ perk_id: number; xp_spent: number; remaining_xp: number }>>(
    `/api/perks/${perkId}/redeem`,
    { method: "POST" },
  );
}
