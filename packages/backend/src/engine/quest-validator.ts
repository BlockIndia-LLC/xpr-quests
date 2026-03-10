import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  quests,
  progress,
  users,
  skillXp,
  questMetrics,
} from "../db/schema.js";
import { broadcastToUser } from "../ws/events.js";
import {
  calculateLevel,
  calculateTier,
  calculateBoostedXP,
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

    // Auto-award off-chain XP (user still needs to "claim" for on-chain)
    await awardXPOffChain(
      actor,
      quest.xp_reward ?? 0,
      quest.skill_tree ?? "defi",
    );
  }
}

async function awardXPOffChain(
  account: string,
  xpReward: number,
  skillTree: string,
): Promise<void> {
  // Ensure user exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.name, account))
    .limit(1);

  if (!existing[0]) {
    await db.insert(users).values({
      name: account,
      lifetime_xp: xpReward,
      spendable_xp: xpReward,
      level: calculateLevel(xpReward),
      tier: calculateTier(xpReward),
      kyc_verified: false,
      xp_multiplier: 100,
      titles: [],
      joined_at: new Date(),
      updated_at: new Date(),
    });
  } else {
    const multiplier = existing[0].xp_multiplier ?? 100;
    const boostedXP = calculateBoostedXP(xpReward, multiplier);
    const newLifetime = (existing[0].lifetime_xp ?? 0) + boostedXP;
    const newSpendable = (existing[0].spendable_xp ?? 0) + boostedXP;

    await db
      .update(users)
      .set({
        lifetime_xp: newLifetime,
        spendable_xp: newSpendable,
        level: calculateLevel(newLifetime),
        tier: calculateTier(newLifetime),
        updated_at: new Date(),
      })
      .where(eq(users.name, account));
  }

  // Update skill XP -- upsert on unique (user_name, skill_tree) index
  await db
    .insert(skillXp)
    .values({
      user_name: account,
      skill_tree: skillTree,
      xp: xpReward,
      tree_level: 0,
      quests_completed: 1,
    })
    .onConflictDoUpdate({
      target: [skillXp.user_name, skillXp.skill_tree],
      set: {
        xp: sql`${skillXp.xp} + ${xpReward}`,
        quests_completed: sql`${skillXp.quests_completed} + 1`,
      },
    });
}
