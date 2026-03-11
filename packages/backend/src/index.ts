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
import { createRoutes } from "./routes/create.js";
import { perksRoutes } from "./routes/perks.js";
import { notificationsRoutes } from "./routes/notifications.js";
import { adminRoutes } from "./routes/admin.js";
import { startWebSocketServer } from "./ws/events.js";
import { startHyperionListener } from "./lib/hyperion.js";
import { startChainSyncProcessor } from "./chain/sync.js";
import { startKYCSyncJob } from "./chain/kyc-sync.js";

const app = new Hono();

// ── Global middleware ────────────────────────────────────────────────────────

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGINS,
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
app.route("/api", createRoutes);
app.route("/api", perksRoutes);
app.route("/api", notificationsRoutes);
app.route("/api", adminRoutes);

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

// Start chain sync queue processor
startChainSyncProcessor();

// Start KYC multiplier sync job
startKYCSyncJob();

export default app;
