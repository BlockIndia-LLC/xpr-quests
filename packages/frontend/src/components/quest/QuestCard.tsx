"use client";

import Link from "next/link";
import { Zap, CheckCircle } from "lucide-react";
import { Quest, SKILL_TREE_INFO } from "@xpr-quests/shared";

interface QuestCardProps {
  quest: Quest;
  progress?: {
    current_count: number;
    completed: boolean;
    claimed: boolean;
  };
}

export default function QuestCard({ quest, progress }: QuestCardProps) {
  const skillInfo =
    SKILL_TREE_INFO[quest.skill_tree as keyof typeof SKILL_TREE_INFO];
  const progressPercent = progress
    ? Math.min(100, (progress.current_count / quest.required_count) * 100)
    : 0;

  return (
    <Link href={`/quests/${quest.quest_id}`} className="block group">
      <div className="relative bg-background-card rounded-xl border border-surface-border p-5 transition-all duration-200 hover:border-accent-purple/50 hover:shadow-lg hover:shadow-accent-purple/10 h-full flex flex-col">
        {/* Completed overlay badge */}
        {progress?.completed && !progress.claimed && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/20 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Completed
          </div>
        )}

        {/* Claimed badge */}
        {progress?.claimed && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent-purple/20 text-accent-purple text-xs font-medium px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Claimed
          </div>
        )}

        {/* Skill tree tag */}
        {skillInfo && (
          <span
            className="skill-pill mb-3 w-fit text-white/90"
            style={{ backgroundColor: `${skillInfo.color}20`, color: skillInfo.color }}
          >
            {skillInfo.title}
          </span>
        )}

        {/* Title */}
        <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-accent-purple transition-colors">
          {quest.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">
          {quest.description}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-accent-purple">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">{quest.xp_reward} XP</span>
          </div>

          {quest.difficulty && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface text-gray-300">
              {quest.difficulty}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress && !progress.claimed && (
          <div className="mt-3 bg-surface rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
