import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { seasons, seasonXp, seasonRewards, notifications } from "../db/schema.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import { authMiddleware, adminGuard } from "../middleware/auth.js";
import {
  snapshotLeaderboard,
  distributeRewards,
  endSeasonOnChain,
  startSeasonOnChain,
} from "../chain/seasons.js";
import { SEASON_REWARD_TIERS } from "@xpr-quests/shared";

type Variables = { account: string };
const seasonRoutes = new Hono<{ Variables: Variables }>();

// GET /seasons — list all seasons
seasonRoutes.get("/seasons", async (c) => {
  const cacheKey = "seasons:all";
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  const allSeasons = await db
    .select()
    .from(seasons)
    .orderBy(desc(seasons.start_time));

  const response = { success: true, data: allSeasons };
  await cacheSet(cacheKey, response, 60);
  return c.json(response);
});

// GET /seasons/:id — season detail
seasonRoutes.get("/seasons/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ success: false, error: "Invalid season ID" }, 400);
  }

  const cacheKey = `seasons:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  const season = await db
    .select()
    .from(seasons)
    .where(eq(seasons.season_id, id))
    .limit(1);

  if (!season[0]) {
    return c.json({ success: false, error: "Season not found" }, 404);
  }

  const response = { success: true, data: season[0] };
  await cacheSet(cacheKey, response, 60);
  return c.json(response);
});

// GET /seasons/:id/rewards — user's reward for this season
seasonRoutes.get("/seasons/:id/rewards", authMiddleware, async (c) => {
  const seasonId = parseInt(c.req.param("id"));
  const account = c.get("account");

  const reward = await db
    .select()
    .from(seasonRewards)
    .where(
      sql`${seasonRewards.season_id} = ${seasonId} AND ${seasonRewards.user_name} = ${account}`,
    )
    .limit(1);

  return c.json({
    success: true,
    data: reward[0] ?? null,
  });
});

// POST /seasons/:id/end — end season, compute rankings, snapshot to chain
seasonRoutes.post("/seasons/:id/end", authMiddleware, adminGuard, async (c) => {
  const seasonId = parseInt(c.req.param("id"));

  const season = await db
    .select()
    .from(seasons)
    .where(eq(seasons.season_id, seasonId))
    .limit(1);
  if (!season[0]) return c.json({ success: false, error: "Season not found" }, 404);
  if (season[0].status !== 1) {
    return c.json({ success: false, error: "Season is not active" }, 400);
  }

  // End the season in DB
  await db
    .update(seasons)
    .set({ status: 2 })
    .where(eq(seasons.season_id, seasonId));

  // Compute rankings from season_xp
  const rankings = await db
    .select()
    .from(seasonXp)
    .where(eq(seasonXp.season_id, seasonId))
    .orderBy(desc(seasonXp.xp));

  // Assign ranks
  const entries = rankings.map((r, i) => ({
    user: r.user_name!,
    xp: Number(r.xp ?? 0),
    rank: i + 1,
  }));

  // Update ranks in season_xp table
  for (const entry of entries) {
    await db
      .update(seasonXp)
      .set({ rank: entry.rank })
      .where(
        sql`${seasonXp.user_name} = ${entry.user} AND ${seasonXp.season_id} = ${seasonId}`,
      );
  }

  // Snapshot to chain and end on-chain
  await endSeasonOnChain(seasonId);
  if (entries.length > 0) {
    await snapshotLeaderboard(seasonId, entries);
  }

  return c.json({
    success: true,
    data: { season_id: seasonId, total_participants: entries.length },
  });
});

// POST /seasons/:id/distribute — distribute rewards
seasonRoutes.post("/seasons/:id/distribute", authMiddleware, adminGuard, async (c) => {
  const seasonId = parseInt(c.req.param("id"));

  const season = await db
    .select()
    .from(seasons)
    .where(eq(seasons.season_id, seasonId))
    .limit(1);
  if (!season[0]) return c.json({ success: false, error: "Season not found" }, 404);
  if (season[0].status !== 2) {
    return c.json({ success: false, error: "Season must be ended before distribution" }, 400);
  }

  // Get rankings
  const rankings = await db
    .select()
    .from(seasonXp)
    .where(eq(seasonXp.season_id, seasonId))
    .orderBy(seasonXp.rank);

  // Calculate rewards per user based on tier thresholds
  const rewardEntries: Array<{ user: string; rank: number; amount: string }> = [];

  for (const entry of rankings) {
    const rank = entry.rank ?? 0;
    if (rank <= 0) continue;

    const tier = SEASON_REWARD_TIERS.find(
      (t: { rank_start: number; rank_end: number; xpr_per_user: string }) => rank >= t.rank_start && rank <= t.rank_end,
    );
    if (!tier) continue;

    rewardEntries.push({
      user: entry.user_name!,
      rank,
      amount: tier.xpr_per_user,
    });
  }

  // Store rewards in DB
  for (const reward of rewardEntries) {
    await db
      .insert(seasonRewards)
      .values({
        season_id: seasonId,
        user_name: reward.user,
        rank: reward.rank,
        reward_amount: reward.amount,
        claimed: false,
      })
      .onConflictDoNothing();

    // Create notification
    await db.insert(notifications).values({
      user_name: reward.user,
      event_type: "season_reward",
      title: `Season Reward: ${reward.amount}`,
      body: `You placed #${reward.rank} and earned ${reward.amount}`,
      created_at: new Date(),
    });
  }

  // Update season status to distributed (3)
  await db
    .update(seasons)
    .set({ status: 3 })
    .where(eq(seasons.season_id, seasonId));

  // Distribute on-chain
  if (rewardEntries.length > 0) {
    await distributeRewards(
      seasonId,
      rewardEntries.map((r) => ({ user: r.user, amount: r.amount })),
    );
  }

  return c.json({
    success: true,
    data: { season_id: seasonId, rewards_count: rewardEntries.length },
  });
});

// POST /seasons/:id/claim-reward — returns unsigned tx data for frontend wallet signing
seasonRoutes.post("/seasons/:id/claim-reward", authMiddleware, async (c) => {
  const seasonId = parseInt(c.req.param("id"));
  const account = c.get("account");

  const reward = await db
    .select()
    .from(seasonRewards)
    .where(
      sql`${seasonRewards.season_id} = ${seasonId} AND ${seasonRewards.user_name} = ${account}`,
    )
    .limit(1);

  if (!reward[0]) {
    return c.json({ success: false, error: "No reward found" }, 404);
  }
  if (reward[0].claimed) {
    return c.json({ success: false, error: "Already claimed" }, 400);
  }

  const seasonsContract = "xprseasons";

  // Return the action for frontend to sign via wallet
  return c.json({
    success: true,
    data: {
      action: {
        account: seasonsContract,
        name: "claimseasonrwd",
        authorization: [{ actor: account, permission: "active" }],
        data: { user: account, season_id: seasonId },
      },
    },
  });
});

// POST /seasons/:id/claim-confirm — called after user signs the tx
seasonRoutes.post("/seasons/:id/claim-confirm", authMiddleware, async (c) => {
  const seasonId = parseInt(c.req.param("id"));
  const account = c.get("account");
  const body = await c.req.json();
  const txId = body.tx_id;

  await db
    .update(seasonRewards)
    .set({
      claimed: true,
      claimed_at: new Date(),
      tx_id: txId || null,
    })
    .where(
      sql`${seasonRewards.season_id} = ${seasonId} AND ${seasonRewards.user_name} = ${account}`,
    );

  return c.json({ success: true });
});

export { seasonRoutes };
