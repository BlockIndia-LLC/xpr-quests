import { Hono } from "hono";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { authMiddleware } from "../middleware/auth.js";

type Variables = { account: string };
const notificationsRoutes = new Hono<{ Variables: Variables }>();

// GET /notifications — list user's notifications
notificationsRoutes.get("/notifications", authMiddleware, async (c) => {
  const account = c.get("account");
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20"), 50);
  const unreadOnly = c.req.query("unread") === "true";

  const conditions = [eq(notifications.user_name, account)];
  if (unreadOnly) conditions.push(eq(notifications.read, false));

  const list = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.created_at))
    .limit(limit);

  // Also get unread count
  const unreadResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.user_name, account), eq(notifications.read, false)));

  return c.json({
    success: true,
    data: list,
    unread_count: Number(unreadResult[0]?.count ?? 0),
  });
});

// POST /notifications/read — mark notifications as read
notificationsRoutes.post("/notifications/read", authMiddleware, async (c) => {
  const account = c.get("account");
  const body = await c.req.json();

  if (body.ids && Array.isArray(body.ids)) {
    // Mark specific notifications as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.user_name, account), inArray(notifications.id, body.ids)),
      );
  } else {
    // Mark all as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.user_name, account), eq(notifications.read, false)));
  }

  return c.json({ success: true });
});

export { notificationsRoutes };
