import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  quests,
  progress,
  users,
  skillXp,
  seasonXp,
  questMetrics,
} from "../db/schema.js";
import { broadcastToUser } from "../ws/events.js";
import { checkKYCStatus } from "../chain/tables.js";
import {
  calculateLevel,
  calculateTier,
  calculateBoostedXP,
  getTierName,
  QuestType,
  XP_MULTIPLIER,
  SOULBOUND_TITLES,
} from "@xpr-quests/shared";
import type { WsEvent } from "@xpr-quests/shared";

export interface HyperionAction {
  act: {
    account: string;
    name: string;
    authorization: Array<{ actor: string; permission: string }>;
    data: Record<string, unknown>;
  };
  "@timestamp": string;
  global_sequence: number;
}

export async function processAction(action: HyperionAction): Promise<void> {
  const actor = action.act.authorization[0]?.actor;
  if (!actor) return;

  const contract = action.act.account;
  const actionName = action.act.name;

  // Find all active quests matching this contract:action
  const matchingQuests = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.target_contract, contract),
        eq(quests.target_action, actionName),
        eq(quests.status, 1), // active
      ),
    );

  for (const quest of matchingQuests) {
    await processQuestForUser(actor, quest, action);
  }
}

async function processQuestForUser(
  actor: string,
  quest: typeof quests.$inferSelect,
  action: HyperionAction,
): Promise<void> {
  // Check max completions
  if (
    quest.max_completions != null &&
    quest.max_completions > 0 &&
    (quest.completed_count ?? 0) >= quest.max_completions
  ) {
    return;
  }

  // Check prerequisite quest completion
  if (quest.prereq_quest_id && quest.prereq_quest_id > 0) {
    const prereqDone = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.user_name, actor),
          eq(progress.quest_id, quest.prereq_quest_id),
          eq(progress.completed, true),
        ),
      )
      .limit(1);
    if (!prereqDone[0]) return;
  }

  // Check target_params filters if set
  if (quest.target_params && typeof quest.target_params === "object") {
    const params = quest.target_params as Record<string, unknown>;
    // Example: check min_amount filter
    if (params.min_amount && action.act.data.quantity) {
      const amount = parseFloat(
        String(action.act.data.quantity).split(" ")[0],
      );
      const minAmount = parseFloat(String(params.min_amount).split(" ")[0]);
      if (amount < minAmount) return;
    }
  }

  const questId = quest.quest_id;

  // Get or create progress
  let prog = await db
    .select()
    .from(progress)
    .where(
      and(eq(progress.user_name, actor), eq(progress.quest_id, questId)),
    )
    .limit(1);

  if (!prog[0]) {
    // Create new progress entry
    await db.insert(progress).values({
      user_name: actor,
      quest_id: questId,
      current_count: 0,
      completed: false,
      claimed: false,
    });

    // Update quest metrics
    await db
      .insert(questMetrics)
      .values({
        quest_id: questId,
        total_starts: 1,
        total_completions: 0,
      })
      .onConflictDoUpdate({
        target: questMetrics.quest_id,
        set: { total_starts: sql`${questMetrics.total_starts} + 1` },
      });

    prog = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.user_name, actor), eq(progress.quest_id, questId)),
      )
      .limit(1);
  }

  if (!prog[0] || prog[0].completed) return; // Already completed

  // Increment progress
  const newCount = (prog[0].current_count ?? 0) + 1;
  const requiredCount = quest.required_count ?? 1;
  const completed = newCount >= requiredCount;

  await db
    .update(progress)
    .set({
      current_count: newCount,
      completed,
      completed_at: completed ? new Date() : null,
    })
    .where(eq(progress.id, prog[0].id));

  // Broadcast progress update via WebSocket
  const progressEvent: WsEvent = {
    type: completed ? "quest_complete" : "quest_progress",
    data: {
      account: actor,
      quest_id: Number(questId),
      current_count: newCount,
      required_count: requiredCount,
    },
  };
  broadcastToUser(actor, progressEvent);

  // If completed, update metrics and user XP
  if (completed) {
    await db
      .update(questMetrics)
      .set({
        total_completions: sql`${questMetrics.total_completions} + 1`,
        updated_at: new Date(),
      })
      .where(eq(questMetrics.quest_id, questId));

    // Auto-award off-chain XP
    await awardXPOffChain(
      actor,
      quest.xp_reward ?? 0,
      quest.skill_tree ?? "defi",
      quest.season_id ?? 0,
    );

    // Check if any composite quests are now completable
    await checkCompositeQuests(actor, quest.skill_tree ?? "defi");
  }
}

async function awardXPOffChain(
  account: string,
  xpReward: number,
  skillTree: string,
  seasonId: number,
): Promise<void> {
  // Ensure user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.name, account))
    .limit(1);

  if (!existing[0]) {
    // New user — check KYC for multiplier
    let multiplier: number = XP_MULTIPLIER.DEFAULT;
    let isKYCVerified = false;
    try {
      const isKYC = await checkKYCStatus(account);
      if (isKYC) {
        multiplier = XP_MULTIPLIER.KYC_VERIFIED;
        isKYCVerified = true;
      }
    } catch {
      // Chain call failed — use default multiplier
    }

    const boostedXP = calculateBoostedXP(xpReward, multiplier);
    const newLevel = calculateLevel(boostedXP);
    const newTier = calculateTier(boostedXP);

    await db.insert(users).values({
      name: account,
      lifetime_xp: boostedXP,
      spendable_xp: boostedXP,
      level: newLevel,
      tier: newTier,
      kyc_verified: isKYCVerified,
      xp_multiplier: multiplier,
      titles: [],
      joined_at: new Date(),
      updated_at: new Date(),
    });

    // Broadcast level_up for new users starting above level 0
    if (newLevel > 0) {
      broadcastToUser(account, {
        type: "level_up",
        data: { account, new_level: newLevel },
      });
    }
  } else {
    let multiplier: number = existing[0].xp_multiplier ?? XP_MULTIPLIER.DEFAULT;

    // Check KYC if not yet verified
    if (!existing[0].kyc_verified) {
      try {
        const isKYC = await checkKYCStatus(account);
        if (isKYC) {
          multiplier = XP_MULTIPLIER.KYC_VERIFIED;
          await db
            .update(users)
            .set({
              kyc_verified: true,
              xp_multiplier: XP_MULTIPLIER.KYC_VERIFIED,
            })
            .where(eq(users.name, account));
        }
      } catch {
        // Chain call failed — keep existing multiplier
      }
    }

    const boostedXP = calculateBoostedXP(xpReward, multiplier);
    const oldLifetime = existing[0].lifetime_xp ?? 0;
    const newLifetime = oldLifetime + boostedXP;
    const newSpendable = (existing[0].spendable_xp ?? 0) + boostedXP;

    const oldLevel = calculateLevel(oldLifetime);
    const oldTier = calculateTier(oldLifetime);
    const newLevel = calculateLevel(newLifetime);
    const newTier = calculateTier(newLifetime);

    await db
      .update(users)
      .set({
        lifetime_xp: newLifetime,
        spendable_xp: newSpendable,
        level: newLevel,
        tier: newTier,
        updated_at: new Date(),
      })
      .where(eq(users.name, account));

    // Broadcast level/tier up events
    if (newLevel > oldLevel) {
      broadcastToUser(account, {
        type: "level_up",
        data: { account, new_level: newLevel },
      });
    }
    if (newTier > oldTier) {
      broadcastToUser(account, {
        type: "tier_up",
        data: { account, new_tier: newTier },
      });
    }
  }

  // Update skill XP — upsert on unique (user_name, skill_tree) index
  const boostedXP = calculateBoostedXP(
    xpReward,
    (existing?.[0]?.xp_multiplier ?? XP_MULTIPLIER.DEFAULT),
  );
  await db
    .insert(skillXp)
    .values({
      user_name: account,
      skill_tree: skillTree,
      xp: boostedXP,
      tree_level: 0,
      quests_completed: 1,
    })
    .onConflictDoUpdate({
      target: [skillXp.user_name, skillXp.skill_tree],
      set: {
        xp: sql`${skillXp.xp} + ${boostedXP}`,
        quests_completed: sql`${skillXp.quests_completed} + 1`,
      },
    });

  // Update season XP if quest belongs to a season
  if (seasonId > 0) {
    await db
      .insert(seasonXp)
      .values({
        user_name: account,
        season_id: seasonId,
        xp: boostedXP,
        rank: 0,
      })
      .onConflictDoUpdate({
        target: [seasonXp.user_name, seasonXp.season_id],
        set: {
          xp: sql`${seasonXp.xp} + ${boostedXP}`,
        },
      });
  }
}

async function checkCompositeQuests(
  actor: string,
  skillTree: string,
): Promise<void> {
  // Find active composite quests in this skill tree
  const composites = await db
    .select()
    .from(quests)
    .where(
      and(
        eq(quests.skill_tree, skillTree),
        eq(quests.quest_type, QuestType.COMPOSITE),
        eq(quests.status, 1),
      ),
    );

  for (const composite of composites) {
    // Check if already completed
    const existingProg = await db
      .select()
      .from(progress)
      .where(
        and(
          eq(progress.user_name, actor),
          eq(progress.quest_id, composite.quest_id),
        ),
      )
      .limit(1);
    if (existingProg[0]?.completed) continue;

    // Get all non-composite branch quests in this skill tree
    const branchQuests = await db
      .select()
      .from(quests)
      .where(
        and(
          eq(quests.skill_tree, skillTree),
          eq(quests.status, 1),
        ),
      );

    // Check if all non-composite quests are completed
    let allDone = true;
    for (const bq of branchQuests) {
      if (bq.quest_type === QuestType.COMPOSITE) continue;
      const bqProg = await db
        .select()
        .from(progress)
        .where(
          and(
            eq(progress.user_name, actor),
            eq(progress.quest_id, bq.quest_id),
            eq(progress.completed, true),
          ),
        )
        .limit(1);
      if (!bqProg[0]) {
        allDone = false;
        break;
      }
    }

    if (allDone) {
      // Auto-complete the composite quest
      await db
        .insert(progress)
        .values({
          user_name: actor,
          quest_id: composite.quest_id,
          current_count: 1,
          completed: true,
          completed_at: new Date(),
          claimed: false,
        })
        .onConflictDoNothing();

      // Broadcast completion
      broadcastToUser(actor, {
        type: "quest_complete",
        data: {
          account: actor,
          quest_id: Number(composite.quest_id),
          current_count: 1,
          required_count: 1,
        },
      });

      // Award composite XP
      await awardXPOffChain(
        actor,
        composite.xp_reward ?? 0,
        skillTree,
        composite.season_id ?? 0,
      );

      // Award soulbound title for branch completion
      await awardBranchTitle(actor, skillTree);
    }
  }
}

async function awardBranchTitle(
  account: string,
  skillTree: string,
): Promise<void> {
  const title = SOULBOUND_TITLES[skillTree as keyof typeof SOULBOUND_TITLES];
  if (!title) return;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.name, account))
    .limit(1);
  if (!user[0]) return;

  const currentTitles = user[0].titles ?? [];
  if (currentTitles.includes(title)) return;

  await db
    .update(users)
    .set({ titles: [...currentTitles, title] })
    .where(eq(users.name, account));

  broadcastToUser(account, {
    type: "title_earned",
    data: { account, quest_id: 0 },
  });
}
