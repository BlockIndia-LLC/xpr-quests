import {
  calculateBoostedXP,
  calculateLevel,
  calculateTier,
  Tier,
  TIER_THRESHOLDS,
} from "@xpr-quests/shared";

export { calculateBoostedXP, calculateLevel, calculateTier };

/**
 * Get the minimum XP required to reach a given tier.
 */
export function getXPForTier(tier: Tier): number {
  return TIER_THRESHOLDS[tier];
}

/**
 * Get the XP threshold for the next tier above the player's current XP.
 * Returns null if the player is already at the highest tier.
 */
export function getNextTierXP(currentXP: number): number | null {
  const currentTier = calculateTier(currentXP);
  const nextTier = currentTier + 1;
  if (nextTier > Tier.CHAIN_ELDER) return null;
  return TIER_THRESHOLDS[nextTier as Tier];
}

/**
 * Calculate progress percentage (0-100) toward the next tier.
 */
export function getTierProgress(currentXP: number): number {
  const currentTier = calculateTier(currentXP);
  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = getNextTierXP(currentXP);
  if (!nextThreshold) return 100;
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 100;
  return Math.min(100, ((currentXP - currentThreshold) / range) * 100);
}
