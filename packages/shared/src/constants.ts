import { Tier } from "./types";

// ============================================================
// Tier thresholds (minimum lifetime XP for each tier)
// ============================================================

export const TIER_THRESHOLDS: Record<Tier, number> = {
  [Tier.NEWCOMER]: 0,
  [Tier.EXPLORER]: 1_000,
  [Tier.PATHFINDER]: 5_000,
  [Tier.ARCHITECT]: 10_000,
  [Tier.LEGEND]: 25_000,
  [Tier.CHAIN_ELDER]: 50_000,
};

// ============================================================
// Contract account names
// ============================================================

export const CONTRACTS = {
  QUESTS: "xprquests",
  XP: "xprquestxp",
  SEASONS: "xprseasons",
  GOV_BOOST: "xprgovboost",
  ATOMIC_ASSETS: "atomicassets",
  IDENTITY: "identity",
  TOKEN: "eosio.token",
} as const;

// ============================================================
// Chain IDs
// ============================================================

export const CHAIN_IDS = {
  MAINNET: "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0",
  TESTNET: "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd",
} as const;

// ============================================================
// Skill tree definitions
// ============================================================

export const SKILL_TREE_INFO = {
  defi: {
    name: "defi",
    title: "DeFi Explorer",
    description: "Master decentralized finance on XPR Network",
    icon: "TrendingUp",
    color: "#22c55e",
  },
  governance: {
    name: "governance",
    title: "Governance Guardian",
    description: "Shape the future of XPR Network governance",
    icon: "Vote",
    color: "#3b82f6",
  },
  nft: {
    name: "nft",
    title: "NFT Creator",
    description: "Create and collect digital assets",
    icon: "Palette",
    color: "#f59e0b",
  },
  social: {
    name: "social",
    title: "Community Builder",
    description: "Grow and strengthen the XPR community",
    icon: "Users",
    color: "#ec4899",
  },
} as const;

// ============================================================
// KYC multiplier values (stored as basis points, 100 = 1.0x)
// ============================================================

export const XP_MULTIPLIER = {
  DEFAULT: 100,
  KYC_VERIFIED: 150,
} as const;

// ============================================================
// Anti-sybil defaults
// ============================================================

export const ANTI_SYBIL = {
  MIN_ACCOUNT_AGE_HRS: 48,
  MAX_QUEST_COMPLETIONS_PER_HOUR: 20,
} as const;

// ============================================================
// Quest badge collection
// ============================================================

export const NFT_COLLECTION = "xprquestbdg" as const;
