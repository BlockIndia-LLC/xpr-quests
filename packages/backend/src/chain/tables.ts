import { getTableRows } from "./client.js";
import { env } from "../config.js";
import { CONTRACTS } from "@xpr-quests/shared";
import type { XPAccountRow, ProgressRow, SkillXPRow, SeasonXPRow } from "@xpr-quests/shared";

export async function getUserXP(account: string): Promise<XPAccountRow | null> {
  const rows = await getTableRows<XPAccountRow>(
    CONTRACTS.XP, "accounts", CONTRACTS.XP,
    { lower_bound: account, upper_bound: account, limit: 1 }
  );
  return rows[0] || null;
}

export async function getQuestProgress(user: string, questId: number): Promise<ProgressRow | null> {
  const rows = await getTableRows<ProgressRow>(
    CONTRACTS.QUESTS, "progress", user,
    { lower_bound: String(questId), upper_bound: String(questId), limit: 1 }
  );
  return rows[0] || null;
}

export async function getUserSkillXP(user: string): Promise<SkillXPRow[]> {
  return getTableRows<SkillXPRow>(CONTRACTS.XP, "skillxp", user);
}

export async function getUserSeasonXP(user: string, seasonId: number): Promise<SeasonXPRow | null> {
  const rows = await getTableRows<SeasonXPRow>(
    CONTRACTS.XP, "seasonxp", String(seasonId),
    { lower_bound: user, upper_bound: user, limit: 1 }
  );
  return rows[0] || null;
}

export async function checkKYCStatus(account: string): Promise<boolean> {
  const rows = await getTableRows(
    CONTRACTS.IDENTITY, "users", CONTRACTS.IDENTITY,
    { lower_bound: account, upper_bound: account, limit: 1 }
  );
  return rows.length > 0 && rows[0].kyc_verified === true;
}
