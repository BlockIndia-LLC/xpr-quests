import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { generateToken } from "../middleware/auth.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const authRoutes = new Hono();

const loginSchema = z.object({
  account: z.string().min(1).max(13),
  // TODO Phase 2: add signature + message fields for cryptographic verification
  // signature: z.string(),
  // message: z.string(),
});

// POST /auth/login
authRoutes.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, error: "Invalid request body" }, 400);
  }

  const { account } = parsed.data;

  // TODO Phase 2: verify signature against on-chain public key
  // 1. Fetch account's active key via apiClient.v1.chain.get_account(account)
  // 2. Verify signature of message using @wharfkit/antelope crypto utilities
  // 3. Check that message timestamp is within 5 minutes to prevent replay

  // Ensure user exists in DB (upsert)
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.name, account))
    .limit(1);

  if (!existing[0]) {
    await db.insert(users).values({
      name: account,
      lifetime_xp: 0,
      spendable_xp: 0,
      level: 0,
      tier: 0,
      kyc_verified: false,
      xp_multiplier: 100,
      titles: [],
      joined_at: new Date(),
      updated_at: new Date(),
    });
  }

  const token = generateToken(account);

  return c.json({
    success: true,
    data: {
      account,
      token,
      expiresIn: "7d",
    },
  });
});

export { authRoutes };
