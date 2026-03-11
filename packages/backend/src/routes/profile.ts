import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, progress, skillXp, reports } from "../db/schema.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  calculateLevel,
  calculateTier,
  getTierName,
  xpProgress,
} from "@xpr-quests/shared";

type Variables = { account: string };
const profileRoutes = new Hono<{ Variables: Variables }>();

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

// POST /reports — report a user (auth required)
profileRoutes.post("/reports", authMiddleware, async (c) => {
  const reporter = c.get("account");
  const body = await c.req.json();

  if (!body.reported_user) {
    return c.json({ success: false, error: "reported_user is required" }, 400);
  }
  if (!body.reason || body.reason.length > 500) {
    return c.json({ success: false, error: "reason is required (max 500 characters)" }, 400);
  }
  if (body.reported_user === reporter) {
    return c.json({ success: false, error: "Cannot report yourself" }, 400);
  }

  await db.insert(reports).values({
    reporter,
    reported_user: body.reported_user,
    reason: body.reason,
    evidence: body.evidence || null,
    resolved: false,
  });

  return c.json({ success: true, data: { message: "Report submitted" } }, 201);
});

export { profileRoutes };
