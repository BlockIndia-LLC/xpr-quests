import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, progress, skillXp } from "../db/schema.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import {
  calculateLevel,
  calculateTier,
  getTierName,
  xpProgress,
} from "@xpr-quests/shared";

const profileRoutes = new Hono();

// GET /profile/:name - public profile
profileRoutes.get("/profile/:name", async (c) => {
  const name = c.req.param("name");

  const cacheKey = `profile:${name}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  // Get user from DB
  const user = await db
    .select()
    .from(users)
    .where(eq(users.name, name))
    .limit(1);

  if (!user[0]) {
    // User doesn't exist in DB yet, return default profile
    const response = {
      success: true,
      data: {
        account: name,
        lifetime_xp: 0,
        spendable_xp: 0,
        level: 0,
        tier: 0,
        tier_name: "Newcomer",
        kyc_verified: false,
        xp_multiplier: 100,
        titles: [],
        joined_at: new Date().toISOString(),
        skill_xp: [],
        quests_completed: 0,
        badges_earned: 0,
        xp_progress: 0,
      },
    };
    return c.json(response);
  }

  const userData = user[0];
  const lifetimeXp = userData.lifetime_xp ?? 0;
  const level = calculateLevel(lifetimeXp);
  const tier = calculateTier(lifetimeXp);

  // Get skill XP breakdown
  const skills = await db
    .select()
    .from(skillXp)
    .where(eq(skillXp.user_name, name));

  // Get completed quest count
  const completedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(progress)
    .where(and(eq(progress.user_name, name), eq(progress.completed, true)));

  const response = {
    success: true,
    data: {
      account: name,
      lifetime_xp: lifetimeXp,
      spendable_xp: userData.spendable_xp ?? 0,
      level,
      tier,
      tier_name: getTierName(tier),
      kyc_verified: userData.kyc_verified ?? false,
      xp_multiplier: userData.xp_multiplier ?? 100,
      titles: userData.titles ?? [],
      joined_at: userData.joined_at?.toISOString() ?? new Date().toISOString(),
      skill_xp: skills,
      quests_completed: Number(completedResult[0]?.count ?? 0),
      badges_earned: 0, // TODO: integrate atomicassets
      xp_progress: xpProgress(lifetimeXp),
    },
  };

  await cacheSet(cacheKey, response, 30);
  return c.json(response);
});

export { profileRoutes };
