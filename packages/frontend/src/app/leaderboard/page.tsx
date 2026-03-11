"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Crown, Medal, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useSeasons } from "@/hooks/useSeasons";
import { useWallet } from "@/components/wallet/WalletProvider";
import TierBadge from "@/components/profile/TierBadge";
import { SKILL_TREE_INFO } from "@xpr-quests/shared";
import type { Tier } from "@xpr-quests/shared";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: "alltime", label: "All-Time" },
  { key: "season", label: "Season" },
  { key: "skill:defi", label: "DeFi" },
  { key: "skill:governance", label: "Governance" },
  { key: "skill:nft", label: "NFT" },
  { key: "skill:social", label: "Community" },
];

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Rank indicator
// ---------------------------------------------------------------------------

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1.5">
        <Crown size={16} className="text-yellow-400" />
        <span className="text-yellow-400 font-bold">{rank}</span>
      </div>
    );
  }
  if (rank <= 10) {
    return (
      <div className="flex items-center gap-1.5">
        <Medal size={16} className="text-yellow-400" />
        <span className="text-yellow-400 font-semibold">{rank}</span>
      </div>
    );
  }
  if (rank <= 100) {
    return (
      <div className="flex items-center gap-1.5">
        <Medal size={14} className="text-gray-300" />
        <span className="text-gray-300 font-medium">{rank}</span>
      </div>
    );
  }
  if (rank <= 500) {
    return (
      <div className="flex items-center gap-1.5">
        <Medal size={14} className="text-amber-700" />
        <span className="text-amber-700">{rank}</span>
      </div>
    );
  }
  return <span className="text-gray-500">{rank}</span>;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-surface rounded-lg"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("alltime");
  const [page, setPage] = useState(0);
  const { account } = useWallet();
  const { data: seasonsData } = useSeasons();

  // Parse tab into query params
  const isSkillTab = activeTab.startsWith("skill:");
  const skillTree = isSkillTab ? activeTab.split(":")[1] : undefined;
  const activeSeason = seasonsData?.data?.find((s) => s.status === 1);

  const queryType = isSkillTab
    ? "skill" as const
    : activeTab === "season"
      ? "season" as const
      : "alltime" as const;

  const { data, isLoading, error } = useLeaderboard({
    type: queryType,
    season_id: activeTab === "season" ? activeSeason?.season_id : undefined,
    skill_tree: skillTree,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Trophy size={28} className="text-accent-purple" />
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Leaderboard
        </h1>
      </div>

      {/* Tab pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => {
          const skillKey = tab.key.startsWith("skill:")
            ? tab.key.split(":")[1]
            : null;
          const skillInfo = skillKey
            ? SKILL_TREE_INFO[skillKey as keyof typeof SKILL_TREE_INFO]
            : null;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(0);
              }}
              className={clsx(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-accent-purple text-white shadow-md shadow-accent-purple/25"
                  : "bg-surface text-gray-400 hover:text-white hover:bg-surface-hover border border-surface-border",
              )}
            >
              {skillInfo && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: skillInfo.color }}
                />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Season info */}
      {activeTab === "season" && activeSeason && (
        <div className="bg-background-elevated rounded-lg border border-surface-border p-4 mb-6">
          <p className="text-sm text-gray-400">
            Showing rankings for{" "}
            <span className="text-accent-cyan font-semibold">
              {activeSeason.title}
            </span>
            {" "}— Reward Pool:{" "}
            <span className="text-accent-purple font-semibold">
              {activeSeason.reward_pool}
            </span>
          </p>
        </div>
      )}

      {/* Leaderboard table */}
      {error ? (
        <div className="card space-y-3 py-16 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <p className="text-gray-400">
            Failed to load leaderboard. Please try again later.
          </p>
        </div>
      ) : isLoading ? (
        <LeaderboardSkeleton />
      ) : entries.length > 0 ? (
        <>
          {/* Table header */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-surface-border mb-1">
            <div>Rank</div>
            <div>User</div>
            <div className="text-right hidden sm:block">XP</div>
            <div className="text-center hidden md:block">Level</div>
            <div className="text-right">Tier</div>
          </div>

          {/* Table rows */}
          <div className="space-y-1">
            {entries.map((entry) => {
              const isCurrentUser = account === entry.user;
              return (
                <div
                  key={entry.user}
                  className={clsx(
                    "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-4 items-center px-4 py-3 rounded-lg transition-colors",
                    isCurrentUser
                      ? "bg-accent-purple/10 border-l-2 border-accent-purple"
                      : "hover:bg-surface",
                  )}
                >
                  <div>
                    <RankDisplay rank={entry.rank} />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${entry.user}`}
                      className={clsx(
                        "font-medium truncate block transition-colors hover:text-accent-purple",
                        isCurrentUser ? "text-accent-purple" : "text-white",
                      )}
                    >
                      @{entry.user}
                      {isCurrentUser && (
                        <span className="text-xs text-gray-500 ml-2">
                          (you)
                        </span>
                      )}
                    </Link>
                  </div>
                  <div className="text-right hidden sm:block">
                    <span className="text-white font-semibold">
                      {entry.xp.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-center text-gray-400 hidden md:block">
                    {entry.level}
                  </div>
                  <div className="flex justify-end">
                    <TierBadge tier={entry.tier as Tier} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-surface-border">
              <p className="text-sm text-gray-500">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg bg-surface text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="p-2 rounded-lg bg-surface text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No rankings yet</p>
          <p className="text-gray-500 text-sm">
            Complete quests to appear on the leaderboard.
          </p>
        </div>
      )}
    </div>
  );
}
