import { enqueueChainAction } from "./sync.js";
import { env } from "../config.js";

export async function createSeasonOnChain(
  title: string,
  startTime: number,
  endTime: number,
  rewardPool: string,
): Promise<void> {
  await enqueueChainAction("createseason", {
    admin: env.ADMIN_ACCOUNTS[0],
    title,
    start_time: startTime,
    end_time: endTime,
    reward_pool: rewardPool,
  });
}

export async function startSeasonOnChain(seasonId: number): Promise<void> {
  await enqueueChainAction("startseason", {
    admin: env.ADMIN_ACCOUNTS[0],
    season_id: seasonId,
  });
}

export async function endSeasonOnChain(seasonId: number): Promise<void> {
  await enqueueChainAction("endseason", {
    admin: env.ADMIN_ACCOUNTS[0],
    season_id: seasonId,
  });
}

export async function snapshotLeaderboard(
  seasonId: number,
  entries: Array<{ user: string; xp: number; rank: number }>,
): Promise<void> {
  // Batch in chunks of 100 to avoid tx size limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await enqueueChainAction("snapshot", {
      admin: env.ADMIN_ACCOUNTS[0],
      season_id: seasonId,
      users: batch.map((e) => e.user),
      xps: batch.map((e) => e.xp),
      ranks: batch.map((e) => e.rank),
    });
  }
}

export async function distributeRewards(
  seasonId: number,
  rewards: Array<{ user: string; amount: string }>,
): Promise<void> {
  // Batch in chunks of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < rewards.length; i += BATCH_SIZE) {
    const batch = rewards.slice(i, i + BATCH_SIZE);
    await enqueueChainAction("distribute", {
      admin: env.ADMIN_ACCOUNTS[0],
      season_id: seasonId,
      users: batch.map((r) => r.user),
      amounts: batch.map((r) => r.amount),
    });
  }
}
