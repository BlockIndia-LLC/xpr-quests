"use client";

import {
  TrendingUp,
  Vote,
  Palette,
  Users,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useSkillTrees } from "@/hooks/useSkillTrees";
import { useWallet } from "@/components/wallet/WalletProvider";
import { SkillTreeBranch } from "@/components/skill-tree/SkillTreeBranch";
import type { SkillTreeWithProgress } from "@xpr-quests/shared";

// ---------------------------------------------------------------------------
// Skill tree icons
// ---------------------------------------------------------------------------

const TREE_ICONS: Record<string, React.ElementType> = {
  defi: TrendingUp,
  governance: Vote,
  nft: Palette,
  social: Users,
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SkillTreeSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-surface rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-surface rounded" />
          <div className="h-3 w-60 bg-surface rounded" />
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-surface rounded-full" />
            <div className="w-16 h-3 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tree card
// ---------------------------------------------------------------------------

function SkillTreeCard({ tree }: { tree: SkillTreeWithProgress }) {
  const Icon = TREE_ICONS[tree.skill_tree] ?? Zap;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${tree.color}20` }}
        >
          <Icon size={20} style={{ color: tree.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg text-white truncate">
            {tree.title}
          </h3>
          <p className="text-xs text-gray-500 truncate">{tree.description}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-400">
          <Zap size={14} className="inline mr-1" style={{ color: tree.color }} />
          {tree.user_xp.toLocaleString()} XP
        </span>
        <span className="text-gray-400">
          {tree.user_quests_completed}/{tree.quests.length} quests
        </span>
      </div>

      {/* Branch visualization */}
      <SkillTreeBranch tree={tree} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SkillTreesPage() {
  const { isConnected } = useWallet();
  const { data, isLoading, error } = useSkillTrees();

  const trees = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
        Skill Trees
      </h1>
      <p className="text-gray-400 mb-8">
        Master XPR Network through branching quest paths. Complete all quests
        in a branch to earn a soulbound title.
      </p>

      {/* Not connected banner */}
      {!isConnected && (
        <div className="bg-background-elevated rounded-lg border border-surface-border p-4 mb-8 text-center">
          <p className="text-gray-400 text-sm">
            Connect your wallet to track your progress and unlock quests.
          </p>
        </div>
      )}

      {/* Content */}
      {error ? (
        <div className="card space-y-3 py-16 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <p className="text-gray-400">
            Failed to load skill trees. Please try again later.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkillTreeSkeleton key={i} />
          ))}
        </div>
      ) : trees.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {trees.map((tree) => (
            <SkillTreeCard key={tree.skill_tree} tree={tree} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <p className="text-gray-400">No skill trees available yet.</p>
        </div>
      )}
    </div>
  );
}
