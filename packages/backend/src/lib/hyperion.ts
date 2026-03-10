import { env } from "../config.js";
import { redis } from "../redis/client.js";
import {
  processAction,
  type HyperionAction,
} from "../engine/quest-validator.js";
import { db } from "../db/index.js";
import { quests } from "../db/schema.js";
import { eq } from "drizzle-orm";

const POLL_INTERVAL_MS = 2_000;
const LAST_SEQ_KEY = "hyperion:last_seq";

// Track which contract:action pairs have already logged an error
// to avoid spamming the console every 2 seconds
const errorLoggedFor = new Set<string>();

async function getMonitoredActions(): Promise<Set<string>> {
  const activeQuests = await db
    .select({
      target_contract: quests.target_contract,
      target_action: quests.target_action,
    })
    .from(quests)
    .where(eq(quests.status, 1));

  const actions = new Set<string>();
  for (const q of activeQuests) {
    if (q.target_contract && q.target_action) {
      actions.add(`${q.target_contract}:${q.target_action}`);
    }
  }
  return actions;
}

async function pollHyperion(): Promise<void> {
  const lastTimestamp =
    (await redis.get(LAST_SEQ_KEY)) ||
    new Date(Date.now() - 60_000).toISOString();

  const monitoredActions = await getMonitoredActions();
  if (monitoredActions.size === 0) return;

  for (const contractAction of monitoredActions) {
    const [contract, action] = contractAction.split(":");
    try {
      const url = new URL(
        `${env.XPR_HYPERION_ENDPOINT}/v2/history/get_actions`,
      );
      url.searchParams.set("account", contract);
      url.searchParams.set("filter", `${contract}:${action}`);
      url.searchParams.set("after", lastTimestamp);
      url.searchParams.set("limit", "100");
      url.searchParams.set("sort", "asc");

      const response = await fetch(url.toString());
      if (!response.ok) {
        if (!errorLoggedFor.has(contractAction)) {
          console.warn(
            `[Hyperion] Error polling ${contractAction}: HTTP ${response.status} (further errors suppressed)`,
          );
          errorLoggedFor.add(contractAction);
        }
        continue;
      }

      // Clear error log on success
      errorLoggedFor.delete(contractAction);

      const data = (await response.json()) as {
        actions: HyperionAction[];
      };
      if (!data.actions?.length) continue;

      for (const act of data.actions) {
        try {
          await processAction(act);
        } catch (err) {
          console.error(`[Hyperion] Error processing action:`, err);
        }
      }

      const lastAction = data.actions[data.actions.length - 1];
      if (lastAction) {
        await redis.set(LAST_SEQ_KEY, lastAction["@timestamp"]);
      }
    } catch (err) {
      if (!errorLoggedFor.has(contractAction)) {
        console.error(`[Hyperion] Poll error for ${contractAction}:`, err);
        errorLoggedFor.add(contractAction);
      }
    }
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

async function probeHyperionEndpoint(): Promise<boolean> {
  try {
    const url = `${env.XPR_HYPERION_ENDPOINT}/v2/health`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (response.ok) return true;

    // Fallback: try the actions endpoint directly
    const actionsUrl = `${env.XPR_HYPERION_ENDPOINT}/v2/history/get_actions?limit=1`;
    const actionsResponse = await fetch(actionsUrl, {
      signal: AbortSignal.timeout(5000),
    });
    return actionsResponse.ok;
  } catch {
    return false;
  }
}

export async function startHyperionListener(): Promise<void> {
  console.log(
    `[Hyperion] Checking endpoint: ${env.XPR_HYPERION_ENDPOINT}`,
  );

  const isAvailable = await probeHyperionEndpoint();

  if (!isAvailable) {
    console.warn(
      `[Hyperion] WARNING: Endpoint does not support Hyperion v2 API.`,
    );
    console.warn(
      `[Hyperion] Action polling is DISABLED. Quest progress will not be tracked automatically.`,
    );
    console.warn(
      `[Hyperion] To enable, set XPR_HYPERION_ENDPOINT to a valid Hyperion v2 endpoint in .env`,
    );
    return;
  }

  console.log(
    `[Hyperion] Endpoint verified. Polling every ${POLL_INTERVAL_MS}ms`,
  );

  pollTimer = setInterval(async () => {
    try {
      await pollHyperion();
    } catch (err) {
      console.error("[Hyperion] Poll cycle error:", err);
    }
  }, POLL_INTERVAL_MS);
}

export function stopHyperionListener(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.log("[Hyperion] Listener stopped");
  }
}
