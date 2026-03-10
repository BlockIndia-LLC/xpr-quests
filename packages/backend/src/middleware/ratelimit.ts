import { createMiddleware } from "hono/factory";
import { redis } from "../redis/client.js";
import { ANTI_SYBIL } from "@xpr-quests/shared";

export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const account = c.get("account") as string | undefined;
  if (!account) {
    await next();
    return;
  }

  const key = `ratelimit:${account}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour window
  }

  if (current > ANTI_SYBIL.MAX_QUEST_COMPLETIONS_PER_HOUR) {
    return c.json(
      { success: false, error: "Rate limit exceeded. Max 20 quest completions per hour." },
      429
    );
  }

  await next();
});
