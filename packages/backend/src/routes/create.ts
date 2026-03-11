import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { quests, users } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";
import { Tier, QuestType, SKILL_TREES } from "@xpr-quests/shared";

type Variables = { account: string };
const createRoutes = new Hono<{ Variables: Variables }>();

// POST /quests/create — Community quest creation (Explorer tier+ required)
createRoutes.post("/quests/create", authMiddleware, async (c) => {
  const account = c.get("account");

  // Check user tier — must be Explorer (1000+ XP)
  const user = await db.select().from(users).where(sql`${users.name} = ${account}`).limit(1);
  if (!user[0]) {
    return c.json({ success: false, error: "User not found" }, 404);
  }
  if ((user[0].tier ?? 0) < Tier.EXPLORER) {
    return c.json(
      { success: false, error: "Explorer tier (1,000+ XP) required to create quests" },
      403,
    );
  }

  const body = await c.req.json();

  // Validate required fields
  const { title, description, quest_type, target_contract, target_action, required_count, xp_reward, skill_tree, difficulty } = body;

  if (!title || title.length > 100) {
    return c.json({ success: false, error: "Title is required (max 100 characters)" }, 400);
  }
  if (!description || description.length > 500) {
    return c.json({ success: false, error: "Description is required (max 500 characters)" }, 400);
  }
  if (quest_type === undefined || ![0, 1, 2, 4].includes(quest_type)) {
    return c.json({ success: false, error: "Invalid quest type (0, 1, 2, or 4)" }, 400);
  }
  if (quest_type !== QuestType.COMMUNITY_VERIFIED && (!target_contract || !target_action)) {
    return c.json({ success: false, error: "Target contract and action are required for on-chain quests" }, 400);
  }
  if (!required_count || required_count < 1 || required_count > 10000) {
    return c.json({ success: false, error: "Required count must be between 1 and 10,000" }, 400);
  }
  if (!xp_reward || xp_reward < 10 || xp_reward > 1000) {
    return c.json({ success: false, error: "XP reward must be between 10 and 1,000" }, 400);
  }
  if (!skill_tree || !SKILL_TREES.includes(skill_tree)) {
    return c.json({ success: false, error: `Skill tree must be one of: ${SKILL_TREES.join(", ")}` }, 400);
  }

  // Get next quest ID
  const maxId = await db.select({ max: sql<number>`COALESCE(MAX(${quests.quest_id}), 0)` }).from(quests);
  const nextId = (maxId[0]?.max ?? 0) + 1;

  await db.insert(quests).values({
    quest_id: nextId,
    creator: account,
    title,
    description,
    quest_type: quest_type,
    target_contract: target_contract || "",
    target_action: target_action || "",
    target_params: body.target_params || {},
    required_count,
    xp_reward,
    skill_tree,
    difficulty: difficulty || "beginner",
    prereq_quest_id: body.prereq_quest_id || 0,
    season_id: 0,
    kyc_required: body.kyc_required || false,
    min_account_age_hrs: 48,
    max_completions: body.max_completions || 0,
    completed_count: 0,
    nft_template_id: -1,
    nft_collection: "",
    tags: body.tags || [],
    status: 0, // DRAFT — needs admin approval
    created_at: new Date(),
  });

  return c.json({
    success: true,
    data: { quest_id: nextId, status: "draft", message: "Quest submitted for admin review" },
  }, 201);
});

export { createRoutes };
