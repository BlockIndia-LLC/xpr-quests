"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, Zap, CheckCircle2, Loader2, Target, Hash, Users, AlertTriangle } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { fetcher, apiFetch } from "@/lib/api";
import {
  SKILL_TREE_INFO,
  QuestStatus,
  type Quest,
  type QuestProgress,
  type ApiResponse,
} from "@xpr-quests/shared";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  number,
  { label: string; className: string }
> = {
  [QuestStatus.ACTIVE]: {
    label: "Active",
    className: "bg-green-500/20 text-green-400",
  },
  [QuestStatus.DRAFT]: {
    label: "Draft",
    className: "bg-gray-500/20 text-gray-400",
  },
  [QuestStatus.PAUSED]: {
    label: "Paused",
    className: "bg-yellow-500/20 text-yellow-400",
  },
  [QuestStatus.ENDED]: {
    label: "Ended",
    className: "bg-red-500/20 text-red-400",
  },
};

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
// Skeleton
// ---------------------------------------------------------------------------

function QuestDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-5 w-32 bg-surface rounded mb-8" />
      <div className="card space-y-4">
        <div className="h-8 w-3/4 bg-surface rounded" />
        <div className="h-6 w-20 bg-surface rounded-full" />
        <div className="h-4 w-full bg-surface rounded" />
        <div className="h-4 w-2/3 bg-surface rounded" />
        <div className="grid grid-cols-2 gap-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Progress section
// ---------------------------------------------------------------------------

function ProgressSection({
  quest,
  progress,
  onClaim,
  claiming,
}: {
  quest: Quest;
  progress: QuestProgress | null;
  onClaim: () => void;
  claiming: boolean;
}) {
  // No progress yet
  if (!progress) {
    return (
      <div className="bg-background-elevated rounded-lg border border-surface-border p-5 mt-6">
        <p className="text-gray-400 text-sm">
          Complete the required on-chain action to start this quest. Your
          progress will be tracked automatically.
        </p>
      </div>
    );
  }

  const progressPct = Math.min(
    100,
    (progress.current_count / progress.required_count) * 100,
  );

  // Completed and claimed
  if (progress.claimed) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-5 mt-6 flex items-center gap-3">
        <CheckCircle2 size={24} className="text-green-400 flex-shrink-0" />
        <div>
          <p className="text-green-400 font-semibold">
            Quest Completed &amp; Claimed
          </p>
          <p className="text-sm text-gray-400">
            You earned {quest.xp_reward} XP from this quest.
          </p>
        </div>
      </div>
    );
  }

  // Completed but not claimed
  if (progress.completed) {
    return (
      <div className="mt-6 space-y-4">
        <div className="bg-background-elevated rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-medium text-accent-cyan">
              {progress.current_count} / {progress.required_count} completed
            </span>
          </div>
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          onClick={onClaim}
          disabled={claiming}
          className="btn-primary w-full animate-glow-pulse flex items-center justify-center gap-2 text-lg"
        >
          {claiming ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Zap size={20} />
              Claim {quest.xp_reward} XP Reward
            </>
          )}
        </button>
      </div>
    );
  }

  // In progress
  return (
    <div className="bg-background-elevated rounded-lg p-5 mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">Progress</span>
        <span className="text-sm font-medium text-gray-300">
          {progress.current_count} / {progress.required_count} actions completed
        </span>
      </div>
      <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full animate-progress-fill transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const questId = params.id;
  const { mutate } = useSWRConfig();

  const { account, isConnected } = useWallet();
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Fetch quest data
  const { data: questRes, isLoading: questLoading, error: questError } = useSWR<
    ApiResponse<Quest>
  >(`/api/quests/${questId}`, fetcher);

  // Fetch progress (only if connected)
  const { data: progressRes, isLoading: progressLoading } = useSWR<
    ApiResponse<QuestProgress>
  >(
    isConnected && account ? `/api/quests/${questId}/progress` : null,
    fetcher,
  );

  const quest = questRes?.data ?? null;
  const progress = progressRes?.data ?? null;

  const handleClaim = useCallback(async () => {
    if (!questId || claiming) return;
    setClaiming(true);
    setClaimError(null);

    try {
      await apiFetch(`/api/quests/${questId}/claim`, {
        method: "POST",
      });
      // Revalidate quest and progress data
      mutate(`/api/quests/${questId}`);
      mutate(`/api/quests/${questId}/progress`);
      if (account) mutate(`/api/profile/${account}`);
    } catch (err) {
      setClaimError(
        err instanceof Error ? err.message : "Failed to claim reward",
      );
    } finally {
      setClaiming(false);
    }
  }, [questId, claiming, mutate, account]);

  if (questLoading || (isConnected && progressLoading)) {
    return <QuestDetailSkeleton />;
  }

  if (questError) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/quests"
          className="mb-8 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-accent-purple"
        >
          <ArrowLeft size={16} />
          Back to Quests
        </Link>
        <div className="card space-y-3 py-16 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <p className="text-lg text-gray-400">Failed to load quest details</p>
          <p className="text-sm text-gray-500">{questError.message}</p>
        </div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/quests"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-accent-purple transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Quests
        </Link>
        <div className="card text-center py-16">
          <p className="text-xl text-gray-400 mb-2">Quest not found</p>
          <p className="text-sm text-gray-500">
            This quest may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quest.status] ?? STATUS_CONFIG[QuestStatus.DRAFT];
  const skillInfo =
    SKILL_TREE_INFO[quest.skill_tree as keyof typeof SKILL_TREE_INFO];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/quests"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-accent-purple transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to Quests
      </Link>

      {/* Quest detail card */}
      <div className="card space-y-6">
        {/* Title + status */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-white">{quest.title}</h1>
          <span
            className={clsx(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0",
              statusConfig.className,
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 leading-relaxed">{quest.description}</p>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* XP Reward */}
          <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-accent-purple" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                XP Reward
              </p>
              <p className="text-lg font-bold text-white">
                {quest.xp_reward} XP
              </p>
            </div>
          </div>

          {/* Required Actions */}
          <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-accent-cyan" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Required Actions
              </p>
              <p className="text-lg font-bold text-white">
                {quest.required_count}
              </p>
            </div>
          </div>

          {/* Skill Tree */}
          <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: skillInfo
                  ? `${skillInfo.color}20`
                  : "#1e2030",
              }}
            >
              <Hash
                size={20}
                style={{ color: skillInfo?.color ?? "#9ca3af" }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Skill Tree
              </p>
              {skillInfo ? (
                <span
                  className="skill-pill mt-1"
                  style={{
                    backgroundColor: `${skillInfo.color}20`,
                    color: skillInfo.color,
                  }}
                >
                  {skillInfo.title}
                </span>
              ) : (
                <p className="text-sm text-gray-400">{quest.skill_tree}</p>
              )}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
              <Target size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Difficulty
              </p>
              <span
                className={clsx(
                  "skill-pill mt-1 capitalize",
                  difficultyColor(quest.difficulty),
                )}
              >
                {quest.difficulty ?? "Standard"}
              </span>
            </div>
          </div>

          {/* Target Contract */}
          {quest.target_contract && (
            <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                <Hash size={20} className="text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Target Contract
                </p>
                <p className="text-sm font-mono text-gray-300 truncate">
                  {quest.target_contract}
                </p>
              </div>
            </div>
          )}

          {/* Completions */}
          <div className="bg-background-elevated rounded-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Completions
              </p>
              <p className="text-lg font-bold text-white">
                {quest.completed_count}
                {quest.max_completions > 0 && (
                  <span className="text-sm text-gray-500 font-normal">
                    {" "}
                    / {quest.max_completions}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Progress section (connected users only) */}
        {isConnected && (
          <ProgressSection
            quest={quest}
            progress={progress}
            onClaim={handleClaim}
            claiming={claiming}
          />
        )}

        {/* Claim error */}
        {claimError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
            <p className="text-red-400 text-sm">{claimError}</p>
          </div>
        )}

        {/* Not connected notice */}
        {!isConnected && (
          <div className="bg-background-elevated rounded-lg border border-surface-border p-5 mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Connect your wallet to track progress and claim rewards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
