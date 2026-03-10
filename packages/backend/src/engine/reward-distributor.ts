import { broadcastToUser } from "../ws/events.js";
import type { WsEvent } from "@xpr-quests/shared";

/**
 * Orchestrates on-chain reward distribution.
 *
 * The actual on-chain claim happens when the user calls the claimreward
 * contract action. This function handles notifications and any additional
 * off-chain bookkeeping.
 */
export async function distributeReward(
  account: string,
  questId: number,
  xpReward: number,
  _nftTemplateId: number,
  _nftCollection: string,
): Promise<void> {
  console.log(
    `[Rewards] Distributing for ${account}: quest=${questId}, xp=${xpReward}`,
  );

  const event: WsEvent = {
    type: "reward_claimed",
    data: {
      account,
      quest_id: questId,
      xp_awarded: xpReward,
    },
  };

  broadcastToUser(account, event);
}
