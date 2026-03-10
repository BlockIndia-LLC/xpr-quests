import { getSession } from "./client.js";
import { env } from "../config.js";

// Record progress for a user on a quest (called by backend when Hyperion detects action)
export async function recordProgress(user: string, questId: number, increment: number) {
  const session = getSession();
  return session.transact({
    actions: [{
      account: env.CONTRACT_ACCOUNT,
      name: "recordprog",
      authorization: [{ actor: env.CONTRACT_ACCOUNT, permission: "active" }],
      data: { user, quest_id: questId, increment },
    }],
  });
}

// Claim reward -- initiated by user via frontend, but can also be called server-side
export async function claimReward(user: string, questId: number) {
  const session = getSession();
  return session.transact({
    actions: [{
      account: env.CONTRACT_ACCOUNT,
      name: "claimreward",
      authorization: [{ actor: user, permission: "active" }],
      data: { user, quest_id: questId },
    }],
  });
}
