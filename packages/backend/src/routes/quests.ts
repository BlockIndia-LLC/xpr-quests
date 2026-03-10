import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { quests, progress, questMetrics } from "../db/schema.js";
import { optionalAuth, authMiddleware } from "../middleware/auth.js";
import { cacheGet, cacheSet } from "../redis/client.js";

type Variables = { account: string };
const questRoutes = new Hono<{ Variables: Variables }>();

// GET /quests - list quests with filters
questRoutes.get("/quests", optionalAuth, async (c) => {
  const skillTree = c.req.query("skill_tree");
  const seasonId = c.req.query("season_id");
  const status = c.req.query("status") ?? "1"; // default to active
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 50);
  const offset = (page - 1) * limit;

  // Build cache key from filters
  const cacheKey = `quests:${skillTree}:${seasonId}:${status}:${page}:${limit}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  // Build where conditions
  const conditions = [];
  if (status) conditions.push(eq(quests.status, parseInt(status)));
  if (skillTree) conditions.push(eq(quests.skill_tree, skillTree));
  if (seasonId) conditions.push(eq(quests.season_id, parseInt(seasonId)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [questList, countResult] = await Promise.all([
    db
      .select()
      .from(quests)
      .where(where)
      .orderBy(desc(quests.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(quests)
      .where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const response = { success: true, data: questList, total, page, limit };
  await cacheSet(cacheKey, response, 30);
  return c.json(response);
});

// GET /quests/:id - quest detail with user progress
questRoutes.get("/quests/:id", optionalAuth, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const account = c.get("account") as string | undefined;

  const quest = await db
    .select()
    .from(quests)
    .where(eq(quests.quest_id, questId))
    .limit(1);

  if (!quest[0]) {
    return c.json({ success: false, error: "Quest not found" }, 404);
  }

  let userProgress = null;
  if (account) {
    const prog = await db
      .select()
      .from(progress)
      .where(
        and(eq(progress.user_name, account), eq(progress.quest_id, questId)),
      )
      .limit(1);
    userProgress = prog[0] || null;
  }

  return c.json({
    success: true,
    data: { quest: quest[0], progress: userProgress },
  });
});

// POST /quests/:id/claim - claim quest reward
questRoutes.post("/quests/:id/claim", authMiddleware, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const account = c.get("account") as string;

  // Check progress
  const prog = await db
    .select()
    .from(progress)
    .where(
      and(eq(progress.user_name, account), eq(progress.quest_id, questId)),
    )
    .limit(1);

  if (!prog[0]) {
    return c.json({ success: false, error: "No progress found" }, 404);
  }
  if (!prog[0].completed) {
    return c.json({ success: false, error: "Quest not completed" }, 400);
  }
  if (prog[0].claimed) {
    return c.json({ success: false, error: "Already claimed" }, 400);
  }

  // Mark as claimed in DB
  await db
    .update(progress)
    .set({ claimed: true })
    .where(
      and(eq(progress.user_name, account), eq(progress.quest_id, questId)),
    );

  // Get quest for XP reward amount
  const quest = await db
    .select()
    .from(quests)
    .where(eq(quests.quest_id, questId))
    .limit(1);

  // Increment completed_count on the quest
  if (quest[0]) {
    await db
      .update(quests)
      .set({ completed_count: sql`${quests.completed_count} + 1` })
      .where(eq(quests.quest_id, questId));
  }

  return c.json({
    success: true,
    data: {
      quest_id: Number(questId),
      xp_reward: quest[0]?.xp_reward ?? 0,
      claimed: true,
    },
  });
});

export { questRoutes };
