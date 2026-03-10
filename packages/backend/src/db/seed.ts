import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

import { db } from "./index.js";
import { quests, skillTrees, seasons } from "./schema.js";

async function seed() {
  console.log("Seeding database...");

  // ── Seed skill trees ─────────────────────────────────────────────────────

  await db
    .insert(skillTrees)
    .values([
      {
        skill_tree: "defi",
        title: "DeFi Explorer",
        description: "Master decentralized finance on XPR Network",
        icon_url: "/images/defi.png",
        branch_order: [],
      },
      {
        skill_tree: "governance",
        title: "Governance Guardian",
        description: "Shape the future of XPR Network governance",
        icon_url: "/images/governance.png",
        branch_order: [],
      },
      {
        skill_tree: "nft",
        title: "NFT Creator",
        description: "Create and collect digital assets",
        icon_url: "/images/nft.png",
        branch_order: [],
      },
      {
        skill_tree: "social",
        title: "Community Builder",
        description: "Grow and strengthen the XPR community",
        icon_url: "/images/social.png",
        branch_order: [],
      },
    ])
    .onConflictDoNothing();

  // ── Seed default season ──────────────────────────────────────────────────

  await db
    .insert(seasons)
    .values({
      title: "Genesis Season",
      description:
        "The first season of XPR Quests - explore the ecosystem!",
      theme: "general",
      start_time: new Date(),
      end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      reward_pool: "10000.0000 XPR",
      status: 1,
    })
    .onConflictDoNothing();

  // ── Seed 10 Genesis Quests (Section 9 of spec) ───────────────────────────

  const genesisQuests = [
    {
      quest_id: 1,
      creator: "xprquests",
      title: "Welcome to XPR",
      description: "Hold 100+ XPR in your wallet",
      quest_type: 1,
      target_contract: "eosio.token",
      target_action: "transfer",
      target_params: { min_amount: "100.0000 XPR" },
      required_count: 168,
      xp_reward: 50,
      skill_tree: "defi",
      difficulty: "beginner",
      status: 1,
    },
    {
      quest_id: 2,
      creator: "xprquests",
      title: "First Swap",
      description: "Swap any token on Metal X",
      quest_type: 0,
      target_contract: "metalx.swap",
      target_action: "swap",
      target_params: {},
      required_count: 1,
      xp_reward: 50,
      skill_tree: "defi",
      difficulty: "beginner",
      status: 1,
    },
    {
      quest_id: 3,
      creator: "xprquests",
      title: "Stake It Up",
      description: "Stake XPR for the first time",
      quest_type: 0,
      target_contract: "eosio",
      target_action: "delegatebw",
      target_params: {},
      required_count: 1,
      xp_reward: 75,
      skill_tree: "defi",
      difficulty: "beginner",
      status: 1,
    },
    {
      quest_id: 4,
      creator: "xprquests",
      title: "Vote for a BP",
      description: "Vote for a Block Producer",
      quest_type: 0,
      target_contract: "eosio",
      target_action: "voteproducer",
      target_params: {},
      required_count: 1,
      xp_reward: 50,
      skill_tree: "governance",
      difficulty: "beginner",
      status: 1,
    },
    {
      quest_id: 5,
      creator: "xprquests",
      title: "Governance Voice",
      description: "Vote on 3 governance proposals",
      quest_type: 2,
      target_contract: "gov.xpr",
      target_action: "castvote",
      target_params: {},
      required_count: 3,
      xp_reward: 150,
      skill_tree: "governance",
      difficulty: "intermediate",
      status: 1,
    },
    {
      quest_id: 6,
      creator: "xprquests",
      title: "NFT Minter",
      description: "Mint your first NFT",
      quest_type: 0,
      target_contract: "atomicassets",
      target_action: "mintasset",
      target_params: {},
      required_count: 1,
      xp_reward: 50,
      skill_tree: "nft",
      difficulty: "beginner",
      status: 1,
    },
    {
      quest_id: 7,
      creator: "xprquests",
      title: "Collection Creator",
      description: "Create an NFT collection",
      quest_type: 0,
      target_contract: "atomicassets",
      target_action: "createcol",
      target_params: {},
      required_count: 1,
      xp_reward: 150,
      skill_tree: "nft",
      difficulty: "intermediate",
      status: 1,
    },
    {
      quest_id: 8,
      creator: "xprquests",
      title: "Liquidity Provider",
      description: "Add liquidity to any pool",
      quest_type: 0,
      target_contract: "metalx.pool",
      target_action: "addliquidity",
      target_params: {},
      required_count: 1,
      xp_reward: 100,
      skill_tree: "defi",
      difficulty: "intermediate",
      status: 1,
    },
    {
      quest_id: 9,
      creator: "xprquests",
      title: "Swap Master",
      description: "Complete 10 swaps on Metal X",
      quest_type: 0,
      target_contract: "metalx.swap",
      target_action: "swap",
      target_params: {},
      required_count: 10,
      xp_reward: 200,
      skill_tree: "defi",
      difficulty: "advanced",
      status: 1,
    },
    {
      quest_id: 10,
      creator: "xprquests",
      title: "Identity Verified",
      description: "Complete Metal Identity KYC verification",
      quest_type: 4,
      target_contract: "identity",
      target_action: "verify",
      target_params: {},
      required_count: 1,
      xp_reward: 100,
      skill_tree: "social",
      difficulty: "beginner",
      status: 1,
    },
  ];

  for (const quest of genesisQuests) {
    await db
      .insert(quests)
      .values({
        ...quest,
        nft_template_id: -1,
        nft_collection: "",
        prereq_quest_id: 0,
        season_id: 0,
        kyc_required: false,
        min_account_age_hrs: 48,
        max_completions: 0,
        completed_count: 0,
        created_at: new Date(),
      })
      .onConflictDoNothing();
  }

  console.log("Seeded 4 skill trees, 1 season, and 10 genesis quests.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
