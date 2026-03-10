import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  skillTrees,
  skillXp,
  quests,
  progress,
  users,
} from "../db/schema.js";
import { optionalAuth } from "../middleware/auth.js";
import { cacheGet, cacheSet } from "../redis/client.js";
import {
  SKILL_TREE_INFO,
  SOULBOUND_TITLES,
} from "@xpr-quests/shared";
import type {
  SkillTreeWithProgress,
  SkillTreeQuestNode,
  SkillTreeQuestNodeStatus,
} from "@xpr-quests/shared";

type Variables = { account: string };
const skillTreeRoutes = new Hono<{ Variables: Variables }>();

// GET /skill-trees — all trees with user progress
skillTreeRoutes.get("/skill-trees", optionalAuth, async (c) => {
  const account = c.get("account") as string | undefined;
  const cacheKey = account ? `skill-trees:${account}` : "skill-trees:public";
  const cached = await cacheGet<{ success: boolean; data: SkillTreeWithProgress[] }>(cacheKey);
  if (cached) return c.json(cached);

  const trees = await db.select().from(skillTrees);
  const result: SkillTreeWithProgress[] = [];

  for (const tree of trees) {
    const treeInfo =
      SKILL_TREE_INFO[tree.skill_tree as keyof typeof SKILL_TREE_INFO];
    const branchQuestIds = (tree.branch_order as number[]) ?? [];

    // Get the quests in branch order
    const branchQuests: SkillTreeQuestNode[] = [];
    for (let i = 0; i < branchQuestIds.length; i++) {
      const qid = branchQuestIds[i];
      const quest = await db
        .select()
        .from(quests)
        .where(eq(quests.quest_id, qid))
        .limit(1);
      if (!quest[0]) continue;

      let nodeStatus: SkillTreeQuestNodeStatus = "locked";

      if (account) {
        const prog = await db
          .select()
          .from(progress)
          .where(
            and(
              eq(progress.user_name, account),
              eq(progress.quest_id, qid),
            ),
          )
          .limit(1);

        if (prog[0]?.completed) {
          nodeStatus = "completed";
        } else if (prog[0]) {
          nodeStatus = "in_progress";
        } else {
          // Check prereq
          const prereqId = quest[0].prereq_quest_id ?? 0;
          if (prereqId === 0) {
            nodeStatus = "available";
          } else {
            const prereqProg = await db
              .select()
              .from(progress)
              .where(
                and(
                  eq(progress.user_name, account),
                  eq(progress.quest_id, prereqId),
                  eq(progress.completed, true),
                ),
              )
              .limit(1);
            nodeStatus = prereqProg[0] ? "available" : "locked";
          }
        }
      }

      branchQuests.push({
        quest_id: Number(quest[0].quest_id),
        title: quest[0].title ?? "",
        description: quest[0].description ?? "",
        xp_reward: quest[0].xp_reward ?? 0,
        difficulty: quest[0].difficulty ?? "beginner",
        branch_position: i + 1,
        prereq_quest_id: quest[0].prereq_quest_id ?? 0,
        status: nodeStatus,
      });
    }

    // Get user skill XP
    let userXp = 0;
    let userTreeLevel = 0;
    let userQuestsCompleted = 0;
    let titleEarned = false;

    if (account) {
      const userSkill = await db
        .select()
        .from(skillXp)
        .where(
          and(
            eq(skillXp.user_name, account),
            eq(skillXp.skill_tree, tree.skill_tree),
          ),
        )
        .limit(1);
      if (userSkill[0]) {
        userXp = userSkill[0].xp ?? 0;
        userTreeLevel = userSkill[0].tree_level ?? 0;
        userQuestsCompleted = userSkill[0].quests_completed ?? 0;
      }

      // Check if user has the completion title
      const user = await db
        .select()
        .from(users)
        .where(eq(users.name, account))
        .limit(1);
      const titles = user[0]?.titles ?? [];
      const completionTitle =
        SOULBOUND_TITLES[tree.skill_tree as keyof typeof SOULBOUND_TITLES] ??
        "";
      titleEarned = titles.includes(completionTitle);
    }

    result.push({
      skill_tree: tree.skill_tree,
      title: tree.title ?? "",
      description: tree.description ?? "",
      icon_url: tree.icon_url ?? "",
      branch_order: branchQuestIds,
      color: treeInfo?.color ?? "#6b7280",
      user_xp: userXp,
      user_tree_level: userTreeLevel,
      user_quests_completed: userQuestsCompleted,
      quests: branchQuests,
      completion_title:
        SOULBOUND_TITLES[tree.skill_tree as keyof typeof SOULBOUND_TITLES] ??
        "",
      title_earned: titleEarned,
    });
  }

  const response = { success: true, data: result };
  await cacheSet(cacheKey, response, 30);
  return c.json(response);
});

export { skillTreeRoutes };
