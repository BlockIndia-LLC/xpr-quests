import { Tier, TIER_NAMES } from "./types";
import { TIER_THRESHOLDS } from "./constants";

/**
 * Calculate level from lifetime XP.
 * Formula: level = floor(sqrt(lifetime_xp / 100))
 * Level 1 = 100 XP, Level 10 = 10,000 XP, Level 22 = ~50,000 XP
 */
export function calculateLevel(lifetimeXp: number): number {
  if (lifetimeXp < 100) return 0;
  return Math.floor(Math.sqrt(lifetimeXp / 100));
}

/**
 * Calculate tier from lifetime XP.
 */
export function calculateTier(lifetimeXp: number): Tier {
  if (lifetimeXp >= TIER_THRESHOLDS[Tier.CHAIN_ELDER]) return Tier.CHAIN_ELDER;
  if (lifetimeXp >= TIER_THRESHOLDS[Tier.LEGEND]) return Tier.LEGEND;
  if (lifetimeXp >= TIER_THRESHOLDS[Tier.ARCHITECT]) return Tier.ARCHITECT;
  if (lifetimeXp >= TIER_THRESHOLDS[Tier.PATHFINDER]) return Tier.PATHFINDER;
  if (lifetimeXp >= TIER_THRESHOLDS[Tier.EXPLORER]) return Tier.EXPLORER;
  return Tier.NEWCOMER;
}

/**
 * Get the tier display name.
 */
export function getTierName(tier: Tier): string {
  return TIER_NAMES[tier];
}

/**
 * Calculate XP required for the next level.
 * Next level N requires N^2 * 100 total XP.
 */
export function xpForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) ** 2 * 100;
}

/**
 * Calculate XP required for the current level.
 */
export function xpForLevel(level: number): number {
  return level ** 2 * 100;
}

/**
 * Calculate progress percentage to the next level (0-100).
 */
export function xpProgress(lifetimeXp: number): number {
  const level = calculateLevel(lifetimeXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const range = nextLevelXp - currentLevelXp;
  if (range <= 0) return 100;
  const progress = ((lifetimeXp - currentLevelXp) / range) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Calculate boosted XP amount with multiplier.
 * Multiplier is stored as integer where 100 = 1.0x, 150 = 1.5x.
 */
export function calculateBoostedXP(baseXP: number, multiplier: number): number {
  return Math.floor((baseXP * multiplier) / 100);
}
