// ============================================================
// Enums
// ============================================================

export enum QuestType {
  ONCHAIN_ACTION = 0,
  TOKEN_HOLD = 1,
  GOVERNANCE = 2,
  COMPOSITE = 3,
  COMMUNITY_VERIFIED = 4,
}

export enum QuestStatus {
  DRAFT = 0,
  ACTIVE = 1,
  PAUSED = 2,
  ENDED = 3,
}

export enum Tier {
  NEWCOMER = 0,
  EXPLORER = 1,
  PATHFINDER = 2,
  ARCHITECT = 3,
  LEGEND = 4,
  CHAIN_ELDER = 5,
}

export const TIER_NAMES: Record<Tier, string> = {
  [Tier.NEWCOMER]: "Newcomer",
  [Tier.EXPLORER]: "Explorer",
  [Tier.PATHFINDER]: "Pathfinder",
  [Tier.ARCHITECT]: "Architect",
  [Tier.LEGEND]: "Legend",
  [Tier.CHAIN_ELDER]: "Chain Elder",
};

export const SKILL_TREES = ["defi", "governance", "nft", "social"] as const;
export type SkillTree = (typeof SKILL_TREES)[number];

// ============================================================
// On-chain table row types
// ============================================================

export interface QuestRow {
  quest_id: number;
  creator: string;
  title: string;
  description: string;
  quest_type: number;
  target_contract: string;
  target_action: string;
  target_params: string;
  required_count: number;
  xp_reward: number;
  nft_template_id: number;
  nft_collection: string;
  skill_tree: string;
  prereq_quest_id: number;
  season_id: number;
  kyc_required: boolean;
  min_account_age_hrs: number;
  max_completions: number;
  completed_count: number;
  status: number;
  created_at: string;
}

export interface ProgressRow {
  quest_id: number;
  current_count: number;
  completed: boolean;
  completed_at: string;
  claimed: boolean;
}

export interface XPAccountRow {
  user: string;
  lifetime_xp: number;
  spendable_xp: number;
  level: number;
  tier: number;
  kyc_verified: boolean;
  xp_multiplier: number;
  titles: string[];
  joined_at: string;
}

export interface SkillXPRow {
  skill_tree: string;
  xp: number;
  tree_level: number;
  quests_completed: number;
}

export interface SeasonXPRow {
  user: string;
  xp: number;
  rank: number;
}

// ============================================================
// API types
// ============================================================

export interface Quest {
  quest_id: number;
  creator: string;
  title: string;
  description: string;
  quest_type: QuestType;
  target_contract: string;
  target_action: string;
  target_params: Record<string, unknown>;
  required_count: number;
  xp_reward: number;
  nft_template_id: number;
  nft_collection: string;
  skill_tree: string;
  prereq_quest_id: number;
  season_id: number;
  kyc_required: boolean;
  min_account_age_hrs: number;
  max_completions: number;
  completed_count: number;
  status: QuestStatus;
  created_at: string;
  // Extended metadata (off-chain)
  icon_url?: string;
  banner_url?: string;
  difficulty?: string;
  tags?: string[];
}

export interface QuestProgress {
  quest_id: number;
  current_count: number;
  required_count: number;
  completed: boolean;
  completed_at: string | null;
  claimed: boolean;
}

export interface UserProfile {
  account: string;
  lifetime_xp: number;
  spendable_xp: number;
  level: number;
  tier: Tier;
  tier_name: string;
  kyc_verified: boolean;
  xp_multiplier: number;
  titles: string[];
  joined_at: string;
  skill_xp: SkillXPRow[];
  quests_completed: number;
  badges_earned: number;
}

export interface LeaderboardEntry {
  user: string;
  xp: number;
  rank: number;
  level: number;
  tier: Tier;
  tier_name: string;
}

// ============================================================
// API response wrappers
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================
// WebSocket events
// ============================================================

export type WsEventType =
  | "quest_progress"
  | "quest_complete"
  | "reward_claimed"
  | "level_up"
  | "tier_up";

export interface WsEvent {
  type: WsEventType;
  data: {
    account: string;
    quest_id?: number;
    current_count?: number;
    required_count?: number;
    xp_awarded?: number;
    new_level?: number;
    new_tier?: Tier;
  };
}
