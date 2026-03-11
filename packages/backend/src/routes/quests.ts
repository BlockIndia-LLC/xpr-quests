import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { quests, progress, questMetrics, proofSubmissions, users, notifications } from "../db/schema.js";
import { optionalAuth, authMiddleware } from "../middleware/auth.js";
import { rateLimitMiddleware } from "../middleware/ratelimit.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import { QuestType, Tier, REQUIRED_PROOF_APPROVALS } from "@xpr-quests/shared";
import { broadcastToUser } from "../ws/events.js";

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

// POST /quests/:id/claim - claim quest reward (rate limited)
questRoutes.post("/quests/:id/claim", authMiddleware, rateLimitMiddleware, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const account = c.get("account") as string;
  const body = await c.req.json().catch(() => ({}));
  const txId = (body as Record<string, unknown>).tx_id as string | undefined;

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

  // Mark as claimed in DB, set chain_synced if tx_id provided
  await db
    .update(progress)
    .set({
      claimed: true,
      chain_synced: !!txId,
    })
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
      chain_synced: !!txId,
      tx_id: txId || null,
    },
  });
});

// POST /quests/:id/submit-proof — submit proof for Type 4 community-verified quest
questRoutes.post("/quests/:id/submit-proof", authMiddleware, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const account = c.get("account");
  const body = await c.req.json();

  if (!body.proof_url) {
    return c.json({ success: false, error: "proof_url is required" }, 400);
  }

  // Verify quest is type 4 and active
  const quest = await db.select().from(quests).where(eq(quests.quest_id, questId)).limit(1);
  if (!quest[0]) return c.json({ success: false, error: "Quest not found" }, 404);
  if (quest[0].quest_type !== QuestType.COMMUNITY_VERIFIED) {
    return c.json({ success: false, error: "Quest does not accept proof submissions" }, 400);
  }
  if (quest[0].status !== 1) {
    return c.json({ success: false, error: "Quest is not active" }, 400);
  }

  // Check if already submitted
  const existing = await db
    .select()
    .from(proofSubmissions)
    .where(and(eq(proofSubmissions.user_name, account), eq(proofSubmissions.quest_id, questId)))
    .limit(1);
  if (existing[0]) {
    return c.json({ success: false, error: "Proof already submitted for this quest" }, 400);
  }

  await db.insert(proofSubmissions).values({
    user_name: account,
    quest_id: questId,
    proof_url: body.proof_url,
    notes: body.notes || null,
    status: 0, // pending
    approvals: 0,
    rejections: 0,
    reviewed_by: [],
  });

  return c.json({ success: true, data: { message: "Proof submitted for review" } }, 201);
});

// GET /quests/:id/proofs — view proofs for a quest (Architect+ or admin)
questRoutes.get("/quests/:id/proofs", authMiddleware, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const account = c.get("account");

  // Check tier — must be Architect+ (10,000+ XP) or admin
  const user = await db.select().from(users).where(eq(users.name, account)).limit(1);
  if (!user[0] || (user[0].tier ?? 0) < Tier.ARCHITECT) {
    return c.json({ success: false, error: "Architect tier required to review proofs" }, 403);
  }

  const proofs = await db
    .select()
    .from(proofSubmissions)
    .where(and(eq(proofSubmissions.quest_id, questId), eq(proofSubmissions.status, 0)))
    .orderBy(desc(proofSubmissions.created_at));

  return c.json({ success: true, data: proofs });
});

// POST /quests/:id/proofs/:proofId/review — approve/reject a proof (Architect+ tier)
questRoutes.post("/quests/:id/proofs/:proofId/review", authMiddleware, async (c) => {
  const questId = parseInt(c.req.param("id"));
  const proofId = parseInt(c.req.param("proofId"));
  const account = c.get("account");
  const body = await c.req.json();

  if (!body.action || !["approve", "reject"].includes(body.action)) {
    return c.json({ success: false, error: "action must be 'approve' or 'reject'" }, 400);
  }

  // Check tier
  const user = await db.select().from(users).where(eq(users.name, account)).limit(1);
  if (!user[0] || (user[0].tier ?? 0) < Tier.ARCHITECT) {
    return c.json({ success: false, error: "Architect tier required to review proofs" }, 403);
  }

  const proof = await db.select().from(proofSubmissions).where(eq(proofSubmissions.id, proofId)).limit(1);
  if (!proof[0]) return c.json({ success: false, error: "Proof not found" }, 404);
  if (proof[0].status !== 0) return c.json({ success: false, error: "Proof already reviewed" }, 400);
  if (proof[0].user_name === account) {
    return c.json({ success: false, error: "Cannot review your own proof" }, 400);
  }

  const reviewedBy = proof[0].reviewed_by ?? [];
  if (reviewedBy.includes(account)) {
    return c.json({ success: false, error: "Already reviewed this proof" }, 400);
  }

  if (body.action === "approve") {
    const newApprovals = (proof[0].approvals ?? 0) + 1;
    const isApproved = newApprovals >= REQUIRED_PROOF_APPROVALS;

    await db
      .update(proofSubmissions)
      .set({
        approvals: newApprovals,
        reviewed_by: [...reviewedBy, account],
        status: isApproved ? 1 : 0,
      })
      .where(eq(proofSubmissions.id, proofId));

    // If approved, auto-complete the quest for the user
    if (isApproved) {
      await db
        .insert(progress)
        .values({
          user_name: proof[0].user_name,
          quest_id: questId,
          current_count: 1,
          completed: true,
          completed_at: new Date(),
          claimed: false,
        })
        .onConflictDoUpdate({
          target: [progress.user_name, progress.quest_id],
          set: { current_count: 1, completed: true, completed_at: new Date() },
        });

      broadcastToUser(proof[0].user_name, {
        type: "quest_complete",
        data: { account: proof[0].user_name, quest_id: questId, current_count: 1, required_count: 1 },
      });

      await db.insert(notifications).values({
        user_name: proof[0].user_name,
        event_type: "quest_completed",
        title: "Proof Approved!",
        body: "Your proof submission was approved and the quest is now complete.",
        quest_id: questId,
        created_at: new Date(),
      });
    }

    return c.json({ success: true, data: { approved: isApproved, approvals: newApprovals } });
  } else {
    const newRejections = (proof[0].rejections ?? 0) + 1;
    const isRejected = newRejections >= REQUIRED_PROOF_APPROVALS;

    await db
      .update(proofSubmissions)
      .set({
        rejections: newRejections,
        reviewed_by: [...reviewedBy, account],
        status: isRejected ? 2 : 0,
      })
      .where(eq(proofSubmissions.id, proofId));

    if (isRejected) {
      await db.insert(notifications).values({
        user_name: proof[0].user_name,
        event_type: "proof_rejected",
        title: "Proof Rejected",
        body: "Your proof submission was rejected by reviewers.",
        quest_id: questId,
        created_at: new Date(),
      });
    }

    return c.json({ success: true, data: { rejected: isRejected, rejections: newRejections } });
  }
});

export { questRoutes };
