import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, seasonXp, skillXp } from "../db/schema.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import {
  calculateLevel,
  calculateTier,
  getTierName,
} from "@xpr-quests/shared";
import type { LeaderboardEntry } from "@xpr-quests/shared";

const leaderboardRoutes = new Hono();

// GET /leaderboard?type=alltime|season|skill&season_id=N&skill_tree=X&limit=50&offset=0
leaderboardRoutes.get("/leaderboard", async (c) => {
  const type = c.req.query("type") ?? "alltime";
  const seasonId = c.req.query("season_id");
  const skillTree = c.req.query("skill_tree");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "50"), 100);
  const offset = parseInt(c.req.query("offset") ?? "0");

  const cacheKey = `leaderboard:${type}:${seasonId ?? ""}:${skillTree ?? ""}:${limit}:${offset}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  let entries: LeaderboardEntry[] = [];
  let total = 0;

  if (type === "alltime") {
    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(users)
        .orderBy(desc(users.lifetime_xp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users),
    ]);
    total = countResult[0]?.count ?? 0;
    entries = rows.map((row, i) => {
      const xp = row.lifetime_xp ?? 0;
      return {
        user: row.name,
        xp,
        rank: offset + i + 1,
        level: calculateLevel(xp),
        tier: calculateTier(xp),
        tier_name: getTierName(calculateTier(xp)),
      };
    });
  } else if (type === "season" && seasonId) {
    const sid = parseInt(seasonId);
    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(seasonXp)
        .where(eq(seasonXp.season_id, sid))
        .orderBy(desc(seasonXp.xp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(seasonXp)
        .where(eq(seasonXp.season_id, sid)),
    ]);
    total = countResult[0]?.count ?? 0;
    entries = await Promise.all(
      rows.map(async (row, i) => {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.name, row.user_name!))
          .limit(1);
        const lifetimeXp = user[0]?.lifetime_xp ?? 0;
        return {
          user: row.user_name!,
          xp: row.xp ?? 0,
          rank: offset + i + 1,
          level: calculateLevel(lifetimeXp),
          tier: calculateTier(lifetimeXp),
          tier_name: getTierName(calculateTier(lifetimeXp)),
        };
      }),
    );
  } else if (type === "skill" && skillTree) {
    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(skillXp)
        .where(eq(skillXp.skill_tree, skillTree))
        .orderBy(desc(skillXp.xp))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(skillXp)
        .where(eq(skillXp.skill_tree, skillTree)),
    ]);
    total = countResult[0]?.count ?? 0;
    entries = await Promise.all(
      rows.map(async (row, i) => {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.name, row.user_name!))
          .limit(1);
        const lifetimeXp = user[0]?.lifetime_xp ?? 0;
        return {
          user: row.user_name!,
          xp: row.xp ?? 0,
          rank: offset + i + 1,
          level: calculateLevel(lifetimeXp),
          tier: calculateTier(lifetimeXp),
          tier_name: getTierName(calculateTier(lifetimeXp)),
        };
      }),
    );
  }

  const response = { success: true, data: entries, total, limit, offset };
  await cacheSet(cacheKey, response, 30);
  return c.json(response);
});

export { leaderboardRoutes };
