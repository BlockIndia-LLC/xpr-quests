import type { Session, TransactArgs } from "@wharfkit/session";

const QUESTS_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ACCOUNT || "xprquests";
const SEASONS_CONTRACT = "xprseasons";
const XP_CONTRACT = "xprquestxp";

export function buildClaimRewardAction(user: string, questId: number): TransactArgs {
  return {
    actions: [{
      account: QUESTS_CONTRACT,
      name: "claimreward",
      authorization: [{ actor: user, permission: "active" }],
      data: { user, quest_id: questId },
    }],
  };
}

export function buildClaimSeasonRewardAction(user: string, seasonId: number): TransactArgs {
  return {
    actions: [{
      account: SEASONS_CONTRACT,
      name: "claimseasonrwd",
      authorization: [{ actor: user, permission: "active" }],
      data: { user, season_id: seasonId },
    }],
  };
}

export function buildSpendXPAction(user: string, amount: number): TransactArgs {
  return {
    actions: [{
      account: XP_CONTRACT,
      name: "spendxp",
      authorization: [{ actor: user, permission: "active" }],
      data: { user, amount },
    }],
  };
}

export async function signAndSubmit(
  session: Session,
  args: TransactArgs,
): Promise<string | null> {
  const result = await session.transact(args);
  return result.resolved?.transaction?.id?.toString() ?? null;
}
