import { eq, and, sql, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { chainSyncQueue } from "../db/schema.js";
import { getSession } from "./client.js";
import { env } from "../config.js";

let processorInterval: ReturnType<typeof setInterval> | null = null;

// ─── Enqueue a chain action ─────────────────────────────────────────────────

export async function enqueueChainAction(
  actionType: string,
  actionData: Record<string, unknown>,
): Promise<void> {
  // Skip if no private key configured (chain integration disabled)
  if (!env.SERVER_PRIVATE_KEY) return;

  await db.insert(chainSyncQueue).values({
    action_type: actionType,
    action_data: actionData,
    status: "pending",
    attempts: 0,
    max_attempts: 5,
    created_at: new Date(),
  });
}

// ─── Process the queue ──────────────────────────────────────────────────────

async function processQueue(): Promise<void> {
  // Fetch up to 10 pending items
  const pending = await db
    .select()
    .from(chainSyncQueue)
    .where(
      and(
        eq(chainSyncQueue.status, "pending"),
        lte(chainSyncQueue.attempts, chainSyncQueue.max_attempts),
      ),
    )
    .limit(10);

  if (pending.length === 0) return;

  const session = getSession();

  for (const item of pending) {
    try {
      const action = buildAction(item.action_type, item.action_data as Record<string, unknown>);
      const result = await session.transact({ actions: [action] });

      const txId = result.resolved?.transaction?.id?.toString() ?? null;

      await db
        .update(chainSyncQueue)
        .set({
          status: "completed",
          tx_id: txId,
          processed_at: new Date(),
          attempts: (item.attempts ?? 0) + 1,
        })
        .where(eq(chainSyncQueue.id, item.id));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const newAttempts = (item.attempts ?? 0) + 1;
      const maxAttempts = item.max_attempts ?? 5;

      await db
        .update(chainSyncQueue)
        .set({
          attempts: newAttempts,
          last_error: errorMsg,
          status: newAttempts >= maxAttempts ? "failed" : "pending",
        })
        .where(eq(chainSyncQueue.id, item.id));

      console.error(
        `[ChainSync] Failed action ${item.action_type} (attempt ${newAttempts}/${maxAttempts}):`,
        errorMsg,
      );
    }
  }
}

// ─── Build chain action from queue item ─────────────────────────────────────

function buildAction(actionType: string, data: Record<string, unknown>) {
  const contractAccount = env.CONTRACT_ACCOUNT;
  const xpContract = env.XP_CONTRACT_ACCOUNT || "xprquestxp";
  const seasonsContract = env.SEASONS_CONTRACT_ACCOUNT || "xprseasons";

  switch (actionType) {
    case "recordprog":
      return {
        account: contractAccount,
        name: "recordprog",
        authorization: [{ actor: contractAccount, permission: "active" }],
        data: { user: data.user, quest_id: data.quest_id },
      };

    case "addxp":
      return {
        account: xpContract,
        name: "addxp",
        authorization: [{ actor: xpContract, permission: "active" }],
        data: {
          user: data.user,
          amount: data.amount,
          skill_tree: data.skill_tree,
          season_id: data.season_id,
        },
      };

    case "setmultiplr":
      return {
        account: xpContract,
        name: "setmultiplr",
        authorization: [{ actor: xpContract, permission: "active" }],
        data: {
          user: data.user,
          multiplier: data.multiplier,
          kyc_verified: data.kyc_verified,
        },
      };

    case "createseason":
      return {
        account: seasonsContract,
        name: "createseason",
        authorization: [{ actor: data.admin as string, permission: "active" }],
        data: {
          title: data.title,
          start_time: data.start_time,
          end_time: data.end_time,
          reward_pool: data.reward_pool,
        },
      };

    case "startseason":
      return {
        account: seasonsContract,
        name: "startseason",
        authorization: [{ actor: data.admin as string, permission: "active" }],
        data: { season_id: data.season_id },
      };

    case "endseason":
      return {
        account: seasonsContract,
        name: "endseason",
        authorization: [{ actor: data.admin as string, permission: "active" }],
        data: { season_id: data.season_id },
      };

    case "snapshot":
      return {
        account: seasonsContract,
        name: "snapshot",
        authorization: [{ actor: data.admin as string, permission: "active" }],
        data: {
          season_id: data.season_id,
          users: data.users,
          xps: data.xps,
          ranks: data.ranks,
        },
      };

    case "distribute":
      return {
        account: seasonsContract,
        name: "distribute",
        authorization: [{ actor: data.admin as string, permission: "active" }],
        data: {
          season_id: data.season_id,
          users: data.users,
          amounts: data.amounts,
        },
      };

    default:
      throw new Error(`Unknown chain action type: ${actionType}`);
  }
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

export function startChainSyncProcessor(): void {
  if (!env.SERVER_PRIVATE_KEY) {
    console.log("[ChainSync] Disabled — no SERVER_PRIVATE_KEY configured");
    return;
  }

  console.log("[ChainSync] Starting queue processor (every 5s)");
  processorInterval = setInterval(() => {
    processQueue().catch((err) => {
      console.error("[ChainSync] Queue processing error:", err);
    });
  }, 5000);
}

export function stopChainSyncProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    console.log("[ChainSync] Stopped queue processor");
  }
}
