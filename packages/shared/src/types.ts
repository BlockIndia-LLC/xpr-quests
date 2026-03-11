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
  chain_synced?: boolean;
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
// Seasons
// ============================================================

export enum SeasonStatus {
  UPCOMING = 0,
  ACTIVE = 1,
  ENDED = 2,
}

export interface Season {
  season_id: number;
  title: string;
  description: string;
  theme: string;
  start_time: string;
  end_time: string;
  reward_pool: string;
  nft_collection: string;
  status: SeasonStatus;
}

// ============================================================
// Skill tree progression
// ============================================================

export type SkillTreeQuestNodeStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export interface SkillTreeQuestNode {
  quest_id: number;
  title: string;
  description: string;
  xp_reward: number;
  difficulty: string;
  branch_position: number;
  prereq_quest_id: number;
  status: SkillTreeQuestNodeStatus;
}

export interface SkillTreeWithProgress {
  skill_tree: string;
  title: string;
  description: string;
  icon_url: string;
  branch_order: number[];
  color: string;
  user_xp: number;
  user_tree_level: number;
  user_quests_completed: number;
  quests: SkillTreeQuestNode[];
  completion_title: string;
  title_earned: boolean;
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
  | "tier_up"
  | "title_earned"
  | "season_start"
  | "season_end";

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
    title?: string;
  };
}

// ============================================================
// Phase 3 — Perks, Notifications, Proofs, Reports
// ============================================================

export interface Perk {
  perk_id: number;
  partner: string;
  title: string;
  description: string;
  icon_url: string | null;
  xp_cost: number;
  max_redemptions: number;
  redeemed_count: number;
  active: boolean;
  created_at: string;
}

export interface Redemption {
  id: number;
  user_name: string;
  perk_id: number;
  xp_spent: number;
  redeemed_at: string;
  // Joined fields
  perk_title?: string;
  perk_partner?: string;
}

export interface Notification {
  id: number;
  user_name: string;
  event_type: string;
  title: string;
  body: string | null;
  quest_id: number | null;
  read: boolean;
  created_at: string;
}

export enum ProofStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export interface ProofSubmission {
  id: number;
  user_name: string;
  quest_id: number;
  proof_url: string;
  notes: string | null;
  status: ProofStatus;
  approvals: number;
  rejections: number;
  reviewed_by: string[];
  created_at: string;
}

export interface Report {
  id: number;
  reporter: string;
  reported_user: string;
  reason: string;
  evidence: string | null;
  resolved: boolean;
  resolved_by: string | null;
  created_at: string;
}

export const REQUIRED_PROOF_APPROVALS = 3;

// ============================================================
// Phase 4 — On-chain integration types
// ============================================================

export enum ChainSyncStatus {
  PENDING = 0,
  SYNCED = 1,
  FAILED = 2,
}

export interface SeasonRewardTier {
  rank_start: number;
  rank_end: number;
  xpr_per_user: string;
}

export interface SeasonRewardClaim {
  season_id: number;
  user_name: string;
  rank: number;
  reward_amount: string;
  claimed: boolean;
  claimed_at: string | null;
  tx_id: string | null;
}

export interface ChainSyncQueueItem {
  id: number;
  action_type: string;
  action_data: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  tx_id: string | null;
  created_at: string;
  processed_at: string | null;
}
