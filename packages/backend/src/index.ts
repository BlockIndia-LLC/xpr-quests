import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { env } from "./config.js";
import { questRoutes } from "./routes/quests.js";
import { profileRoutes } from "./routes/profile.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { seasonRoutes } from "./routes/seasons.js";
import { skillTreeRoutes } from "./routes/skill-trees.js";
import { startWebSocketServer } from "./ws/events.js";
import { startHyperionListener } from "./lib/hyperion.js";

const app = new Hono();

// ── Global middleware ────────────────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: ["http://localhost:3001", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", logger());

// ── Routes ───────────────────────────────────────────────────────────────────

app.route("/api", healthRoutes);
app.route("/api", authRoutes);
app.route("/api", questRoutes);
app.route("/api", profileRoutes);
app.route("/api", leaderboardRoutes);
app.route("/api", seasonRoutes);
app.route("/api", skillTreeRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

// ── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error("[Server] Unhandled error:", err);
  return c.json({ success: false, error: "Internal server error" }, 500);
});

// ── Start server ─────────────────────────────────────────────────────────────

const server = serve(
  {
    fetch: app.fetch,
    port: env.BACKEND_PORT,
  },
  (info) => {
    console.log(
      `[Server] XPR Quests backend running on http://localhost:${info.port}`,
    );
  },
);

// Start WebSocket server (attaches to the same HTTP server)
startWebSocketServer(server as any);

// Start Hyperion blockchain listener
startHyperionListener().catch((err) => {
  console.error("[Hyperion] Failed to start listener:", err);
});

export default app;
