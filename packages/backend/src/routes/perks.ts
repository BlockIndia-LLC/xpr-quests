import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { perks, redemptions, users, notifications } from "../db/schema.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";
import { cacheGet, cacheSet } from "../redis/client.js";

type Variables = { account: string };
const perksRoutes = new Hono<{ Variables: Variables }>();

// GET /perks — list active perks (public)
perksRoutes.get("/perks", async (c) => {
  const cached = await cacheGet("perks:active");
  if (cached) return c.json(cached);

  const list = await db
    .select()
    .from(perks)
    .where(eq(perks.active, true))
    .orderBy(perks.xp_cost);

  const response = { success: true, data: list };
  await cacheSet("perks:active", response, 60);
  return c.json(response);
});

// GET /perks/history — user's redemption history (auth required)
perksRoutes.get("/perks/history", authMiddleware, async (c) => {
  const account = c.get("account");

  const history = await db
    .select({
      id: redemptions.id,
      perk_id: redemptions.perk_id,
      xp_spent: redemptions.xp_spent,
      redeemed_at: redemptions.redeemed_at,
      perk_title: perks.title,
      perk_partner: perks.partner,
    })
    .from(redemptions)
    .leftJoin(perks, eq(redemptions.perk_id, perks.perk_id))
    .where(eq(redemptions.user_name, account))
    .orderBy(desc(redemptions.redeemed_at));

  return c.json({ success: true, data: history });
});

// POST /perks/:id/redeem — redeem a perk (auth required)
perksRoutes.post("/perks/:id/redeem", authMiddleware, async (c) => {
  const perkId = parseInt(c.req.param("id"));
  const account = c.get("account");

  // Get perk
  const perk = await db.select().from(perks).where(eq(perks.perk_id, perkId)).limit(1);
  if (!perk[0]) return c.json({ success: false, error: "Perk not found" }, 404);
  if (!perk[0].active) return c.json({ success: false, error: "Perk is no longer active" }, 400);

  // Check max redemptions
  const maxRedemptions = perk[0].max_redemptions ?? 0;
  if (maxRedemptions > 0 && (perk[0].redeemed_count ?? 0) >= maxRedemptions) {
    return c.json({ success: false, error: "Perk has reached maximum redemptions" }, 400);
  }

  // Check user's spendable XP
  const user = await db.select().from(users).where(eq(users.name, account)).limit(1);
  if (!user[0]) return c.json({ success: false, error: "User not found" }, 404);

  const xpCost = perk[0].xp_cost ?? 0;
  if ((user[0].spendable_xp ?? 0) < xpCost) {
    return c.json({ success: false, error: "Insufficient spendable XP" }, 400);
  }

  // Deduct XP and record redemption
  await db
    .update(users)
    .set({ spendable_xp: sql`${users.spendable_xp} - ${xpCost}`, updated_at: new Date() })
    .where(eq(users.name, account));

  await db.insert(redemptions).values({
    user_name: account,
    perk_id: perkId,
    xp_spent: xpCost,
    redeemed_at: new Date(),
  });

  await db
    .update(perks)
    .set({ redeemed_count: sql`${perks.redeemed_count} + 1` })
    .where(eq(perks.perk_id, perkId));

  // Create notification
  await db.insert(notifications).values({
    user_name: account,
    event_type: "perk_redeemed",
    title: `Redeemed: ${perk[0].title}`,
    body: `You spent ${xpCost} XP on "${perk[0].title}" from ${perk[0].partner}`,
    created_at: new Date(),
  });

  return c.json({
    success: true,
    data: {
      perk_id: perkId,
      xp_spent: xpCost,
      remaining_xp: (user[0].spendable_xp ?? 0) - xpCost,
    },
  });
});

export { perksRoutes };
