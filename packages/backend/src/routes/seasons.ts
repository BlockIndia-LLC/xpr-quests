import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { seasons } from "../db/schema.js";
import { cacheGet, cacheSet } from "../redis/client.js";

const seasonRoutes = new Hono();

// GET /seasons — list all seasons
seasonRoutes.get("/seasons", async (c) => {
  const cacheKey = "seasons:all";
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  const allSeasons = await db
    .select()
    .from(seasons)
    .orderBy(desc(seasons.start_time));

  const response = { success: true, data: allSeasons };
  await cacheSet(cacheKey, response, 60);
  return c.json(response);
});

// GET /seasons/:id — season detail
seasonRoutes.get("/seasons/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ success: false, error: "Invalid season ID" }, 400);
  }

  const cacheKey = `seasons:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return c.json(cached);

  const season = await db
    .select()
    .from(seasons)
    .where(eq(seasons.season_id, id))
    .limit(1);

  if (!season[0]) {
    return c.json({ success: false, error: "Season not found" }, 404);
  }

  const response = { success: true, data: season[0] };
  await cacheSet(cacheKey, response, 60);
  return c.json(response);
});

export { seasonRoutes };
