import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { ApiResponse, SkillTreeWithProgress } from "@xpr-quests/shared";

export function useSkillTrees() {
  return useSWR<ApiResponse<SkillTreeWithProgress[]>>(
    "/api/skill-trees",
    fetcher,
    { refreshInterval: 30000 },
  );
}
