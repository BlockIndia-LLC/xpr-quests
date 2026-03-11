import { Hono } from "hono";
import { eq, sql, desc, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  quests,
  questMetrics,
  perks,
  reports,
  proofSubmissions,
  seasons,
} from "../db/schema.js";
import { authMiddleware, adminGuard } from "../middleware/auth.js";

type Variables = { account: string };
const adminRoutes = new Hono<{ Variables: Variables }>();

// All admin routes require auth + admin guard
adminRoutes.use("/*", authMiddleware, adminGuard);

// ── Quest Approval ──────────────────────────────────────────────────────────

// GET /admin/quests — list draft quests pending approval
adminRoutes.get("/admin/quests", async (c) => {
  const status = parseInt(c.req.query("status") ?? "0"); // 0 = draft
  const list = await db
    .select()
    .from(quests)
    .where(eq(quests.status, status))
    .orderBy(desc(quests.created_at));
  return c.json({ success: true, data: list });
});

// POST /admin/quests/:id/approve — activate a draft quest
adminRoutes.post("/admin/quests/:id/approve", async (c) => {
  const questId = parseInt(c.req.param("id"));
  const quest = await db.select().from(quests).where(eq(quests.quest_id, questId)).limit(1);
  if (!quest[0]) return c.json({ success: false, error: "Quest not found" }, 404);
  if (quest[0].status !== 0) {
    return c.json({ success: false, error: "Quest is not in draft status" }, 400);
  }

  await db.update(quests).set({ status: 1 }).where(eq(quests.quest_id, questId));
  return c.json({ success: true, data: { quest_id: questId, status: "active" } });
});

// POST /admin/quests/:id/reject — reject a draft quest
adminRoutes.post("/admin/quests/:id/reject", async (c) => {
  const questId = parseInt(c.req.param("id"));
  const quest = await db.select().from(quests).where(eq(quests.quest_id, questId)).limit(1);
  if (!quest[0]) return c.json({ success: false, error: "Quest not found" }, 404);

  await db.update(quests).set({ status: 3 }).where(eq(quests.quest_id, questId)); // ENDED
  return c.json({ success: true, data: { quest_id: questId, status: "rejected" } });
});

// ── Quest Analytics ─────────────────────────────────────────────────────────

adminRoutes.get("/admin/analytics", async (c) => {
  const metrics = await db
    .select({
      quest_id: questMetrics.quest_id,
      total_starts: questMetrics.total_starts,
      total_completions: questMetrics.total_completions,
      completion_rate: questMetrics.completion_rate,
      avg_completion_hours: questMetrics.avg_completion_hours,
      title: quests.title,
      skill_tree: quests.skill_tree,
    })
    .from(questMetrics)
    .leftJoin(quests, eq(questMetrics.quest_id, quests.quest_id))
    .orderBy(desc(questMetrics.total_completions))
    .limit(50);

  return c.json({ success: true, data: metrics });
});

// ── Community Reports ───────────────────────────────────────────────────────

adminRoutes.get("/admin/reports", async (c) => {
  const resolved = c.req.query("resolved") === "true";
  const list = await db
    .select()
    .from(reports)
    .where(eq(reports.resolved, resolved))
    .orderBy(desc(reports.created_at));
  return c.json({ success: true, data: list });
});

adminRoutes.post("/admin/reports/:id/resolve", async (c) => {
  const reportId = parseInt(c.req.param("id"));
  const account = c.get("account");
  const report = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report[0]) return c.json({ success: false, error: "Report not found" }, 404);

  await db
    .update(reports)
    .set({ resolved: true, resolved_by: account })
    .where(eq(reports.id, reportId));
  return c.json({ success: true, data: { report_id: reportId, resolved: true } });
});

// ── Proof Review (Admin can also review proofs) ─────────────────────────────

adminRoutes.get("/admin/proofs", async (c) => {
  const list = await db
    .select({
      id: proofSubmissions.id,
      user_name: proofSubmissions.user_name,
      quest_id: proofSubmissions.quest_id,
      proof_url: proofSubmissions.proof_url,
      notes: proofSubmissions.notes,
      status: proofSubmissions.status,
      approvals: proofSubmissions.approvals,
      rejections: proofSubmissions.rejections,
      created_at: proofSubmissions.created_at,
      quest_title: quests.title,
    })
    .from(proofSubmissions)
    .leftJoin(quests, eq(proofSubmissions.quest_id, quests.quest_id))
    .where(eq(proofSubmissions.status, 0)) // pending
    .orderBy(desc(proofSubmissions.created_at));
  return c.json({ success: true, data: list });
});

// ── Perk Management ─────────────────────────────────────────────────────────

adminRoutes.post("/admin/perks", async (c) => {
  const body = await c.req.json();
  const { partner, title, description, xp_cost, max_redemptions, icon_url } = body;

  if (!partner || !title || !xp_cost) {
    return c.json({ success: false, error: "partner, title, and xp_cost are required" }, 400);
  }

  const result = await db.insert(perks).values({
    partner,
    title,
    description: description || "",
    icon_url: icon_url || null,
    xp_cost,
    max_redemptions: max_redemptions || 0,
    redeemed_count: 0,
    active: true,
    created_at: new Date(),
  }).returning();

  return c.json({ success: true, data: result[0] }, 201);
});

adminRoutes.put("/admin/perks/:id", async (c) => {
  const perkId = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const perk = await db.select().from(perks).where(eq(perks.perk_id, perkId)).limit(1);
  if (!perk[0]) return c.json({ success: false, error: "Perk not found" }, 404);

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.xp_cost !== undefined) updates.xp_cost = body.xp_cost;
  if (body.max_redemptions !== undefined) updates.max_redemptions = body.max_redemptions;
  if (body.active !== undefined) updates.active = body.active;
  if (body.icon_url !== undefined) updates.icon_url = body.icon_url;

  if (Object.keys(updates).length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }

  await db.update(perks).set(updates).where(eq(perks.perk_id, perkId));
  return c.json({ success: true, data: { perk_id: perkId, ...updates } });
});

// ── Season Management ───────────────────────────────────────────────────────

adminRoutes.post("/admin/seasons", async (c) => {
  const body = await c.req.json();
  const { title, description, theme, start_time, end_time, reward_pool } = body;

  if (!title || !start_time || !end_time) {
    return c.json({ success: false, error: "title, start_time, and end_time are required" }, 400);
  }

  const result = await db.insert(seasons).values({
    title,
    description: description || "",
    theme: theme || "general",
    start_time: new Date(start_time),
    end_time: new Date(end_time),
    reward_pool: reward_pool || "0.0000 XPR",
    status: 0, // upcoming
  }).returning();

  return c.json({ success: true, data: result[0] }, 201);
});

adminRoutes.post("/admin/seasons/:id/activate", async (c) => {
  const seasonId = parseInt(c.req.param("id"));
  await db.update(seasons).set({ status: 1 }).where(eq(seasons.season_id, seasonId));
  return c.json({ success: true, data: { season_id: seasonId, status: "active" } });
});

adminRoutes.post("/admin/seasons/:id/end", async (c) => {
  const seasonId = parseInt(c.req.param("id"));
  await db.update(seasons).set({ status: 2 }).where(eq(seasons.season_id, seasonId));
  return c.json({ success: true, data: { season_id: seasonId, status: "ended" } });
});

export { adminRoutes };
