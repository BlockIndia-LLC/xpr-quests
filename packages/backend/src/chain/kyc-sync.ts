import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { checkKYCStatus } from "./tables.js";
import { enqueueChainAction } from "./sync.js";
import { XP_MULTIPLIER } from "@xpr-quests/shared";
import { env } from "../config.js";

let syncInterval: ReturnType<typeof setInterval> | null = null;

async function syncKYCStatuses(): Promise<void> {
  // Find users not yet KYC verified in DB
  const unverified = await db
    .select()
    .from(users)
    .where(eq(users.kyc_verified, false))
    .limit(50);

  if (unverified.length === 0) return;

  let synced = 0;
  for (const user of unverified) {
    try {
      const isKYC = await checkKYCStatus(user.name);
      if (isKYC) {
        await db
          .update(users)
          .set({
            kyc_verified: true,
            xp_multiplier: XP_MULTIPLIER.KYC_VERIFIED,
            updated_at: new Date(),
          })
          .where(eq(users.name, user.name));

        // Sync multiplier on-chain
        await enqueueChainAction("setmultiplr", {
          user: user.name,
          multiplier: XP_MULTIPLIER.KYC_VERIFIED,
          kyc_verified: true,
        });

        synced++;
      }
    } catch {
      // Chain query failed for this user — skip, will retry next cycle
    }
  }

  if (synced > 0) {
    console.log(`[KYCSync] Updated ${synced} user(s) to KYC verified`);
  }
}

export function startKYCSyncJob(): void {
  if (!env.SERVER_PRIVATE_KEY) {
    console.log("[KYCSync] Disabled — no SERVER_PRIVATE_KEY configured");
    return;
  }

  console.log("[KYCSync] Starting periodic sync (every 30 min)");
  // Run immediately once, then every 30 minutes
  syncKYCStatuses().catch((err) => {
    console.error("[KYCSync] Initial sync error:", err);
  });

  syncInterval = setInterval(() => {
    syncKYCStatuses().catch((err) => {
      console.error("[KYCSync] Sync error:", err);
    });
  }, 30 * 60 * 1000);
}

export function stopKYCSyncJob(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[KYCSync] Stopped");
  }
}
