"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, AlertTriangle } from "lucide-react";
import { useQuests } from "@/hooks/useQuests";
import { useSeasons } from "@/hooks/useSeasons";
import { SeasonBanner } from "@/components/season/SeasonBanner";
import {
  SKILL_TREE_INFO,
  SKILL_TREES,
  QuestStatus,
  SeasonStatus,
  type Quest,
} from "@xpr-quests/shared";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Filter pill data
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  ...SKILL_TREES.map((tree) => ({
    key: tree,
    label: SKILL_TREE_INFO[tree].title.split(" ")[0], // "DeFi", "Governance", "NFT", "Community"
  })),
];

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-background-card rounded-xl border border-surface-border p-5 animate-pulse">
      <div className="h-5 bg-surface rounded w-3/4 mb-3" />
      <div className="h-4 bg-surface rounded w-full mb-2" />
      <div className="h-4 bg-surface rounded w-2/3 mb-5" />
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 bg-surface rounded-full" />
        <div className="h-6 w-16 bg-surface rounded-full" />
        <div className="h-6 w-14 bg-surface rounded-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Difficulty badge helper
// ---------------------------------------------------------------------------

function difficultyColor(difficulty?: string): string {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "text-green-400 bg-green-400/15";
    case "medium":
      return "text-yellow-400 bg-yellow-400/15";
    case "hard":
      return "text-red-400 bg-red-400/15";
    default:
      return "text-gray-400 bg-gray-400/15";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuestsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const { data, isLoading, error } = useQuests({
    skill_tree: activeFilter !== "all" ? activeFilter : undefined,
    status: QuestStatus.ACTIVE,
  });

  const { data: seasonsData } = useSeasons();
  const activeSeason = seasonsData?.data?.find(
    (s) => s.status === SeasonStatus.ACTIVE,
  );

  const quests: Quest[] = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page heading */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
        Quest Browser
      </h1>

      {/* Active season banner */}
      {activeSeason && (
        <div className="mb-6">
          <SeasonBanner season={activeSeason} compact />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setActiveFilter(opt.key)}
            className={clsx(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              activeFilter === opt.key
                ? "bg-accent-purple text-white shadow-md shadow-accent-purple/25"
                : "bg-surface text-gray-400 hover:text-white hover:bg-surface-hover border border-surface-border",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Quest grid */}
      {error ? (
        <div className="card space-y-3 py-16 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <p className="text-gray-400">
            Failed to load quests. Please try again later.
          </p>
          <p className="text-xs text-gray-500">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : quests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quests.map((quest) => {
            const skillInfo =
              SKILL_TREE_INFO[
                quest.skill_tree as keyof typeof SKILL_TREE_INFO
              ];

            return (
              <Link key={quest.quest_id} href={`/quests/${quest.quest_id}`}>
                <div className="bg-background-card rounded-xl border border-surface-border p-5 hover:border-accent-purple/50 transition-all duration-200 cursor-pointer group h-full flex flex-col">
                  {/* Title */}
                  <h3 className="font-semibold text-lg text-white group-hover:text-accent-purple transition-colors mb-2 truncate">
                    {quest.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                    {quest.description}
                  </p>

                  {/* Bottom row: skill tag, XP reward, difficulty */}
                  <div className="flex items-center gap-2 flex-wrap mt-auto">
                    {skillInfo && (
                      <span
                        className="skill-pill"
                        style={{
                          backgroundColor: `${skillInfo.color}20`,
                          color: skillInfo.color,
                        }}
                      >
                        {skillInfo.title.split(" ")[0]}
                      </span>
                    )}

                    <span className="skill-pill bg-accent-purple/20 text-accent-purple">
                      <Zap size={12} className="mr-1" />
                      {quest.xp_reward}
                    </span>

                    {quest.difficulty && (
                      <span
                        className={clsx(
                          "skill-pill capitalize",
                          difficultyColor(quest.difficulty),
                        )}
                      >
                        {quest.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No quests found</p>
          <p className="text-gray-500 text-sm">
            {activeFilter !== "all"
              ? "Try selecting a different skill tree filter."
              : "Check back later for new quests."}
          </p>
        </div>
      )}
    </div>
  );
}
