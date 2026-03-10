import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { env } from "../config.js";

// Type for the variables set by auth middleware
export type AuthVariables = {
  account: string;
};

// Required auth - rejects if no valid token
export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Authentication required" }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { account: string };
    c.set("account", payload.account);
    await next();
  } catch {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
});

// Optional auth - sets account if valid token present, continues either way
export const optionalAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { account: string };
      c.set("account", payload.account);
    } catch {
      // Invalid token, continue without auth
    }
  }
  await next();
});

// Admin guard - must be used AFTER authMiddleware
export const adminGuard = createMiddleware(async (c, next) => {
  const account = c.get("account");
  if (!env.ADMIN_ACCOUNTS.includes(account)) {
    return c.json({ success: false, error: "Admin access required" }, 403);
  }
  await next();
});

// Generate JWT token for a verified account
export function generateToken(account: string): string {
  return jwt.sign({ account }, env.JWT_SECRET, { expiresIn: "7d" });
}
