import {
  pgTable,
  varchar,
  bigint,
  smallint,
  boolean,
  timestamp,
  text,
  jsonb,
  integer,
  bigserial,
  serial,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  name: varchar("name", { length: 13 }).primaryKey(),
  lifetime_xp: bigint("lifetime_xp", { mode: "number" }),
  spendable_xp: bigint("spendable_xp", { mode: "number" }),
  level: smallint("level"),
  tier: smallint("tier"),
  kyc_verified: boolean("kyc_verified"),
  xp_multiplier: smallint("xp_multiplier").default(100),
  titles: text("titles").array(),
  joined_at: timestamp("joined_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});

// ─── Quests ──────────────────────────────────────────────────────────────────

export const quests = pgTable(
  "quests",
  {
    quest_id: bigint("quest_id", { mode: "number" }).primaryKey(),
    creator: varchar("creator", { length: 13 }),
    title: varchar("title", { length: 100 }),
    description: varchar("description", { length: 500 }),
    quest_type: smallint("quest_type"),
    target_contract: varchar("target_contract", { length: 13 }),
    target_action: varchar("target_action", { length: 13 }),
    target_params: jsonb("target_params"),
    required_count: integer("required_count"),
    xp_reward: integer("xp_reward"),
    nft_template_id: integer("nft_template_id").default(-1),
    nft_collection: varchar("nft_collection", { length: 13 }),
    skill_tree: varchar("skill_tree", { length: 13 }),
    prereq_quest_id: bigint("prereq_quest_id", { mode: "number" }).default(0),
    season_id: integer("season_id").default(0),
    kyc_required: boolean("kyc_required"),
    min_account_age_hrs: integer("min_account_age_hrs").default(48),
    max_completions: integer("max_completions").default(0),
    completed_count: integer("completed_count").default(0),
    status: smallint("status").default(0),
    icon_url: text("icon_url"),
    banner_url: text("banner_url"),
    difficulty: varchar("difficulty", { length: 20 }).default("beginner"),
    tags: text("tags").array(),
    created_at: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_quests_status").on(table.status, table.season_id),
    index("idx_quests_skill").on(table.skill_tree, table.status),
  ],
);

// ─── Progress ────────────────────────────────────────────────────────────────

export const progress = pgTable(
  "progress",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_name: varchar("user_name", { length: 13 }),
    quest_id: bigint("quest_id", { mode: "number" }),
    current_count: integer("current_count"),
    completed: boolean("completed"),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    claimed: boolean("claimed"),
  },
  (table) => [
    uniqueIndex("uq_progress_user_quest").on(table.user_name, table.quest_id),
    index("idx_progress_user").on(table.user_name),
    index("idx_progress_quest").on(table.quest_id),
  ],
);

// ─── Skill Trees ─────────────────────────────────────────────────────────────

export const skillTrees = pgTable("skill_trees", {
  skill_tree: varchar("skill_tree", { length: 13 }).primaryKey(),
  title: varchar("title", { length: 100 }),
  description: text("description"),
  icon_url: text("icon_url"),
  branch_order: jsonb("branch_order"),
});

// ─── Skill XP ────────────────────────────────────────────────────────────────

export const skillXp = pgTable(
  "skill_xp",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_name: varchar("user_name", { length: 13 }),
    skill_tree: varchar("skill_tree", { length: 13 }),
    xp: bigint("xp", { mode: "number" }),
    tree_level: smallint("tree_level"),
    quests_completed: integer("quests_completed"),
  },
  (table) => [
    uniqueIndex("uq_skill_xp_user_tree").on(table.user_name, table.skill_tree),
  ],
);

// ─── Seasons ─────────────────────────────────────────────────────────────────

export const seasons = pgTable("seasons", {
  season_id: serial("season_id").primaryKey(),
  title: varchar("title", { length: 100 }),
  description: text("description"),
  theme: varchar("theme", { length: 13 }),
  start_time: timestamp("start_time", { withTimezone: true }),
  end_time: timestamp("end_time", { withTimezone: true }),
  reward_pool: varchar("reward_pool", { length: 50 }),
  nft_collection: varchar("nft_collection", { length: 13 }),
  status: smallint("status"),
});

// ─── Season XP ───────────────────────────────────────────────────────────────

export const seasonXp = pgTable(
  "season_xp",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_name: varchar("user_name", { length: 13 }),
    season_id: integer("season_id"),
    xp: bigint("xp", { mode: "number" }),
    rank: integer("rank"),
  },
  (table) => [
    uniqueIndex("uq_season_xp_user_season").on(
      table.user_name,
      table.season_id,
    ),
    index("idx_season_xp_season").on(table.season_id),
    index("idx_season_xp_rank").on(table.season_id, table.rank),
  ],
);

// ─── Perks ───────────────────────────────────────────────────────────────────

export const perks = pgTable("perks", {
  perk_id: bigserial("perk_id", { mode: "number" }).primaryKey(),
  partner: varchar("partner", { length: 13 }),
  title: varchar("title", { length: 100 }),
  description: text("description"),
  icon_url: text("icon_url"),
  xp_cost: integer("xp_cost"),
  max_redemptions: integer("max_redemptions").default(0),
  redeemed_count: integer("redeemed_count").default(0),
  active: boolean("active").default(true),
  created_at: timestamp("created_at", { withTimezone: true }),
});

// ─── Redemptions ─────────────────────────────────────────────────────────────

export const redemptions = pgTable("redemptions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  user_name: varchar("user_name", { length: 13 }),
  perk_id: bigint("perk_id", { mode: "number" }),
  xp_spent: integer("xp_spent"),
  redeemed_at: timestamp("redeemed_at", { withTimezone: true }),
});

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    user_name: varchar("user_name", { length: 13 }),
    event_type: varchar("event_type", { length: 50 }),
    title: varchar("title", { length: 200 }),
    body: text("body"),
    quest_id: bigint("quest_id", { mode: "number" }),
    read: boolean("read").default(false),
    created_at: timestamp("created_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_notifications_user").on(table.user_name, table.read),
  ],
);

// ─── Quest Metrics ───────────────────────────────────────────────────────────

export const questMetrics = pgTable("quest_metrics", {
  quest_id: bigint("quest_id", { mode: "number" }).primaryKey(),
  total_starts: integer("total_starts"),
  total_completions: integer("total_completions"),
  avg_completion_hours: real("avg_completion_hours"),
  completion_rate: real("completion_rate"),
  updated_at: timestamp("updated_at", { withTimezone: true }),
});
