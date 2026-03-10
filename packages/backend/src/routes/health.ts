import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { redis } from "../redis/client.js";

const healthRoutes = new Hono();

healthRoutes.get("/health", async (c) => {
  const checks: Record<string, string> = {};

  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  try {
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");
  return c.json({ success: allOk, checks }, allOk ? 200 : 503);
});

export { healthRoutes };
