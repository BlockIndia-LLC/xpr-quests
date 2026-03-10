"use client";

import { xpProgress, xpForLevel, xpForNextLevel } from "@xpr-quests/shared";

interface XPBarProps {
  currentXP: number;
  level: number;
}

export default function XPBar({ currentXP, level }: XPBarProps) {
  const progress = xpProgress(currentXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForNextLevel(level);
  const xpIntoLevel = currentXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-400">
          Level {level}
        </span>
        <span className="text-xs font-medium text-gray-400">
          Level {level + 1}
        </span>
      </div>

      <div className="bg-surface rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-1.5 text-center">
        {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
      </p>
    </div>
  );
}
