"use client";

import { Shield } from "lucide-react";
import { Tier, TIER_NAMES } from "@xpr-quests/shared";

interface TierBadgeProps {
  tier: Tier;
  size?: "sm" | "md" | "lg";
}

const TIER_COLORS: Record<Tier, { bg: string; text: string; border: string }> =
  {
    [Tier.NEWCOMER]: {
      bg: "bg-tier-newcomer/20",
      text: "text-tier-newcomer",
      border: "border-tier-newcomer/30",
    },
    [Tier.EXPLORER]: {
      bg: "bg-tier-explorer/20",
      text: "text-tier-explorer",
      border: "border-tier-explorer/30",
    },
    [Tier.PATHFINDER]: {
      bg: "bg-tier-pathfinder/20",
      text: "text-tier-pathfinder",
      border: "border-tier-pathfinder/30",
    },
    [Tier.ARCHITECT]: {
      bg: "bg-tier-architect/20",
      text: "text-tier-architect",
      border: "border-tier-architect/30",
    },
    [Tier.LEGEND]: {
      bg: "bg-tier-legend/20",
      text: "text-tier-legend",
      border: "border-tier-legend/30",
    },
    [Tier.CHAIN_ELDER]: {
      bg: "bg-tier-chainElder/20",
      text: "text-tier-chainElder",
      border: "border-tier-chainElder/30",
    },
  };

const SIZE_CLASSES: Record<string, { badge: string; icon: string; text: string }> =
  {
    sm: { badge: "px-2 py-0.5", icon: "w-3 h-3", text: "text-xs" },
    md: { badge: "px-3 py-1", icon: "w-4 h-4", text: "text-sm" },
    lg: { badge: "px-4 py-1.5", icon: "w-5 h-5", text: "text-base" },
  };

export default function TierBadge({ tier, size = "md" }: TierBadgeProps) {
  const colors = TIER_COLORS[tier];
  const sizeClasses = SIZE_CLASSES[size];
  const tierName = TIER_NAMES[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses.badge} ${sizeClasses.text}`}
    >
      <Shield className={sizeClasses.icon} />
      {tierName}
    </span>
  );
}
