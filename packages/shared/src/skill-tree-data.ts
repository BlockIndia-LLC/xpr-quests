import type { SkillTree } from "./types";

// ============================================================
// Soulbound titles awarded on branch completion
// ============================================================

export const SOULBOUND_TITLES: Record<SkillTree, string> = {
  defi: "DeFi Architect",
  governance: "Chain Elder",
  nft: "Digital Artisan",
  social: "Network Architect",
};

// ============================================================
// Branch order: quest IDs in progression order per tree
// Genesis quest IDs (1-10) are reused where they match branch positions.
// New quest IDs start at 101.
// ============================================================

export const BRANCH_ORDER: Record<SkillTree, number[]> = {
  defi: [2, 8, 101, 102, 103],
  governance: [4, 5, 104, 105, 106],
  nft: [6, 7, 107, 108, 109],
  social: [10, 110, 111, 112, 113],
};

// ============================================================
// New branch quests (not covered by genesis quests 1-10)
// ============================================================

export interface BranchQuestSeed {
  quest_id: number;
  title: string;
  description: string;
  quest_type: number; // QuestType enum value
  target_contract: string;
  target_action: string;
  target_params: Record<string, unknown>;
  required_count: number;
  xp_reward: number;
  skill_tree: SkillTree;
  difficulty: string;
  prereq_quest_id: number;
  tags: string[];
}

export const NEW_BRANCH_QUESTS: BranchQuestSeed[] = [
  // ── DeFi branch (positions 3-5) ──────────────────────────
  {
    quest_id: 101,
    title: "Yield Hunter",
    description: "Stake tokens in 3 different pools on Metal X",
    quest_type: 0,
    target_contract: "metalx.pool",
    target_action: "addliquidity",
    target_params: {},
    required_count: 3,
    xp_reward: 150,
    skill_tree: "defi",
    difficulty: "intermediate",
    prereq_quest_id: 8,
    tags: ["defi", "yield"],
  },
  {
    quest_id: 102,
    title: "Lending Pioneer",
    description: "Lend or borrow assets on a Metal lending protocol",
    quest_type: 0,
    target_contract: "metallend",
    target_action: "lend",
    target_params: {},
    required_count: 1,
    xp_reward: 200,
    skill_tree: "defi",
    difficulty: "advanced",
    prereq_quest_id: 101,
    tags: ["defi", "lending"],
  },
  {
    quest_id: 103,
    title: "DeFi Whale",
    description: "Complete all DeFi branch quests to prove your mastery",
    quest_type: 3, // COMPOSITE
    target_contract: "",
    target_action: "",
    target_params: { composite_branch: "defi" },
    required_count: 1,
    xp_reward: 500,
    skill_tree: "defi",
    difficulty: "expert",
    prereq_quest_id: 102,
    tags: ["defi", "composite"],
  },

  // ── Governance branch (positions 3-5) ─────────────────────
  {
    quest_id: 104,
    title: "Proposal Author",
    description: "Submit a governance proposal on XPR Network",
    quest_type: 0,
    target_contract: "gov.xpr",
    target_action: "propose",
    target_params: {},
    required_count: 1,
    xp_reward: 200,
    skill_tree: "governance",
    difficulty: "advanced",
    prereq_quest_id: 5,
    tags: ["governance", "proposal"],
  },
  {
    quest_id: 105,
    title: "Delegation Pro",
    description: "Delegate your vote to another account",
    quest_type: 0,
    target_contract: "eosio",
    target_action: "delegatebw",
    target_params: {},
    required_count: 1,
    xp_reward: 150,
    skill_tree: "governance",
    difficulty: "intermediate",
    prereq_quest_id: 104,
    tags: ["governance", "delegation"],
  },
  {
    quest_id: 106,
    title: "Chain Steward",
    description: "Complete all Governance branch quests",
    quest_type: 3,
    target_contract: "",
    target_action: "",
    target_params: { composite_branch: "governance" },
    required_count: 1,
    xp_reward: 500,
    skill_tree: "governance",
    difficulty: "expert",
    prereq_quest_id: 105,
    tags: ["governance", "composite"],
  },

  // ── NFT branch (positions 3-5) ────────────────────────────
  {
    quest_id: 107,
    title: "Marketplace Seller",
    description: "List an NFT for sale on the marketplace",
    quest_type: 0,
    target_contract: "atomicmarket",
    target_action: "announcesale",
    target_params: {},
    required_count: 1,
    xp_reward: 150,
    skill_tree: "nft",
    difficulty: "intermediate",
    prereq_quest_id: 7,
    tags: ["nft", "marketplace"],
  },
  {
    quest_id: 108,
    title: "10 Sales Club",
    description: "Successfully sell 10 NFTs on the marketplace",
    quest_type: 0,
    target_contract: "atomicmarket",
    target_action: "purchasesale",
    target_params: {},
    required_count: 10,
    xp_reward: 300,
    skill_tree: "nft",
    difficulty: "advanced",
    prereq_quest_id: 107,
    tags: ["nft", "sales"],
  },
  {
    quest_id: 109,
    title: "NFT Mogul",
    description: "Complete all NFT branch quests",
    quest_type: 3,
    target_contract: "",
    target_action: "",
    target_params: { composite_branch: "nft" },
    required_count: 1,
    xp_reward: 500,
    skill_tree: "nft",
    difficulty: "expert",
    prereq_quest_id: 108,
    tags: ["nft", "composite"],
  },

  // ── Social/Community branch (positions 2-5) ───────────────
  {
    quest_id: 110,
    title: "Quest Sharer",
    description: "Share a completed quest with the community",
    quest_type: 4, // COMMUNITY_VERIFIED
    target_contract: "xprquests",
    target_action: "sharequests",
    target_params: {},
    required_count: 1,
    xp_reward: 75,
    skill_tree: "social",
    difficulty: "beginner",
    prereq_quest_id: 10,
    tags: ["social", "sharing"],
  },
  {
    quest_id: 111,
    title: "Networker",
    description: "Complete quests alongside 5 different users",
    quest_type: 4,
    target_contract: "xprquests",
    target_action: "coquest",
    target_params: {},
    required_count: 5,
    xp_reward: 200,
    skill_tree: "social",
    difficulty: "intermediate",
    prereq_quest_id: 110,
    tags: ["social", "network"],
  },
  {
    quest_id: 112,
    title: "Popular Quest",
    description: "Have a shared quest completed by 10 other users",
    quest_type: 4,
    target_contract: "xprquests",
    target_action: "popular",
    target_params: { min_completions: 10 },
    required_count: 1,
    xp_reward: 300,
    skill_tree: "social",
    difficulty: "advanced",
    prereq_quest_id: 111,
    tags: ["social", "popularity"],
  },
  {
    quest_id: 113,
    title: "Ecosystem Leader",
    description: "Complete all Community branch quests",
    quest_type: 3,
    target_contract: "",
    target_action: "",
    target_params: { composite_branch: "social" },
    required_count: 1,
    xp_reward: 500,
    skill_tree: "social",
    difficulty: "expert",
    prereq_quest_id: 112,
    tags: ["social", "composite"],
  },
];

// ============================================================
// Prereq updates for genesis quests (to chain them into branches)
// Maps quest_id → prereq_quest_id to set
// ============================================================

export const GENESIS_PREREQ_UPDATES: Record<number, number> = {
  // DeFi: #2 is first (no prereq), #8 prereqs #2
  8: 2,
  // Governance: #4 is first (no prereq), #5 prereqs #4
  5: 4,
  // NFT: #6 is first (no prereq), #7 prereqs #6
  7: 6,
  // Social: #10 is first (no prereq)
};
