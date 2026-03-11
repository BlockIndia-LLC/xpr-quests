import { getSession } from "./client.js";
import { env } from "../config.js";

// Record progress for a user on a quest (called by backend when Hyperion detects action)
// Contract signature: recordprog(user, quest_id) — no increment param
export async function recordProgress(user: string, questId: number) {
  const session = getSession();
  return session.transact({
    actions: [{
      account: env.CONTRACT_ACCOUNT,
      name: "recordprog",
      authorization: [{ actor: env.CONTRACT_ACCOUNT, permission: "active" }],
      data: { user, quest_id: questId },
    }],
  });
}

// Claim reward -- initiated by user via frontend wallet signing
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

// Add XP on-chain via xprquestxp::addxp (server-signed)
export async function addXPOnChain(
  user: string,
  amount: number,
  skillTree: string,
  seasonId: number,
) {
  const session = getSession();
  const xpContract = env.XP_CONTRACT_ACCOUNT || "xprquestxp";
  return session.transact({
    actions: [{
      account: xpContract,
      name: "addxp",
      authorization: [{ actor: xpContract, permission: "active" }],
      data: { user, amount, skill_tree: skillTree, season_id: seasonId },
    }],
  });
}

// Set KYC multiplier on-chain via xprquestxp::setmultiplr
export async function setMultiplierOnChain(
  user: string,
  multiplier: number,
  kycVerified: boolean,
) {
  const session = getSession();
  const xpContract = env.XP_CONTRACT_ACCOUNT || "xprquestxp";
  return session.transact({
    actions: [{
      account: xpContract,
      name: "setmultiplr",
      authorization: [{ actor: xpContract, permission: "active" }],
      data: { user, multiplier, kyc_verified: kycVerified },
    }],
  });
}

// Create Atomic Assets badge template (admin)
export async function createBadgeTemplate(
  collection: string,
  schema: string,
  questId: number,
  questTitle: string,
  skillTree: string,
  xpReward: number,
  difficulty: string,
  imageUrl: string,
) {
  const session = getSession();
  return session.transact({
    actions: [{
      account: "atomicassets",
      name: "createtempl",
      authorization: [{ actor: env.CONTRACT_ACCOUNT, permission: "active" }],
      data: {
        authorized_creator: env.CONTRACT_ACCOUNT,
        collection_name: collection,
        schema_name: schema,
        transferable: false,
        burnable: false,
        max_supply: 0,
        immutable_data: [
          { key: "name", value: ["string", questTitle] },
          { key: "img", value: ["string", imageUrl] },
          { key: "description", value: ["string", `Badge for completing: ${questTitle}`] },
          { key: "quest_id", value: ["uint64", questId] },
          { key: "skill_tree", value: ["string", skillTree] },
          { key: "xp_reward", value: ["uint32", xpReward] },
          { key: "difficulty", value: ["string", difficulty] },
        ],
      },
    }],
  });
}
