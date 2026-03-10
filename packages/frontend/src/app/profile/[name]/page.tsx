"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Shield, Award, Zap, TrendingUp, AlertTriangle, Crown, Lock } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import {
  SKILL_TREE_INFO,
  SKILL_TREES,
  SOULBOUND_TITLES,
  Tier,
  xpProgress,
  xpForNextLevel,
  xpForLevel,
  type SkillXPRow,
} from "@xpr-quests/shared";
import clsx from "clsx";

// ---------------------------------------------------------------------------
// Tier badge colors
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<Tier, { bg: string; text: string; border: string }> = {
  [Tier.NEWCOMER]: {
    bg: "bg-gray-500/20",
    text: "text-gray-400",
    border: "border-gray-500/30",
  },
  [Tier.EXPLORER]: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
  [Tier.PATHFINDER]: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
  },
  [Tier.ARCHITECT]: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  [Tier.LEGEND]: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
  [Tier.CHAIN_ELDER]: {
    bg: "bg-accent-purple/20",
    text: "text-accent-purple",
    border: "border-accent-purple/30",
  },
};

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-8">
      {/* Header skeleton */}
      <div className="card space-y-4">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="flex gap-3">
          <div className="h-6 w-24 bg-surface rounded-full" />
          <div className="h-6 w-20 bg-surface rounded-full" />
        </div>
        <div className="h-3 w-full bg-surface rounded-full" />
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="h-20 bg-surface rounded-lg" />
          <div className="h-20 bg-surface rounded-lg" />
        </div>
      </div>
      {/* Skills skeleton */}
      <div className="card space-y-4">
        <div className="h-6 w-40 bg-surface rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-surface rounded-lg" />
        ))}
      </div>
      {/* Stats skeleton */}
      <div className="card">
        <div className="h-6 w-24 bg-surface rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-surface rounded-lg" />
          <div className="h-20 bg-surface rounded-lg" />
          <div className="h-20 bg-surface rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skill bar component
// ---------------------------------------------------------------------------

function SkillBar({
  skill,
  maxXp,
}: {
  skill: SkillXPRow;
  maxXp: number;
}) {
  const info =
    SKILL_TREE_INFO[skill.skill_tree as keyof typeof SKILL_TREE_INFO];
  const barWidth = maxXp > 0 ? Math.max(2, (skill.xp / maxXp) * 100) : 2;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: info?.color ?? "#6b7280" }}
          />
          <span className="text-sm font-medium text-gray-300">
            {info?.title ?? skill.skill_tree}
          </span>
        </div>
        <span className="text-sm text-gray-500 tabular-nums">
          {skill.xp.toLocaleString()} XP
        </span>
      </div>
      <div className="w-full bg-surface rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 animate-progress-fill"
          style={{
            width: `${barWidth}%`,
            backgroundColor: info?.color ?? "#6b7280",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const params = useParams<{ name: string }>();
  const name = params.name;

  const { data, isLoading, error } = useProfile(name);
  const profile = data?.data ?? null;

  const progressPct = useMemo(() => {
    if (!profile) return 0;
    return xpProgress(profile.lifetime_xp);
  }, [profile]);

  const nextLevelXp = useMemo(() => {
    if (!profile) return 0;
    return xpForNextLevel(profile.level);
  }, [profile]);

  const currentLevelXp = useMemo(() => {
    if (!profile) return 0;
    return xpForLevel(profile.level);
  }, [profile]);

  const maxSkillXp = useMemo(() => {
    if (!profile?.skill_xp) return 0;
    return Math.max(...profile.skill_xp.map((s) => s.xp), 0);
  }, [profile]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="card space-y-3 py-16 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-400" />
          <p className="text-xl text-gray-400">Failed to load profile</p>
          <p className="text-sm text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="card text-center py-16">
          <p className="text-xl text-gray-400 mb-2">Profile not found</p>
          <p className="text-sm text-gray-500">
            The account &ldquo;{name}&rdquo; does not exist or has not joined
            XPR Quests yet.
          </p>
        </div>
      </div>
    );
  }

  const tierColors = TIER_COLORS[profile.tier] ?? TIER_COLORS[Tier.NEWCOMER];

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* ================================================================ */}
      {/* Profile header card                                              */}
      {/* ================================================================ */}
      <section className="card glow-border space-y-5">
        {/* Account name */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          @{profile.account}
        </h1>

        {/* Tier badge + Level */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={clsx(
              "inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border",
              tierColors.bg,
              tierColors.text,
              tierColors.border,
            )}
          >
            {profile.tier_name}
          </span>
          <span className="text-sm text-gray-400 font-medium">
            Level {profile.level}
          </span>
        </div>

        {/* XP Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Level Progress
            </span>
            <span className="text-xs text-gray-400 tabular-nums">
              {(profile.lifetime_xp - currentLevelXp).toLocaleString()} /{" "}
              {(nextLevelXp - currentLevelXp).toLocaleString()} XP
            </span>
          </div>
          <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full animate-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Stat boxes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background-elevated rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Zap size={14} className="text-accent-cyan" />
              Lifetime XP
            </p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {profile.lifetime_xp.toLocaleString()}
            </p>
          </div>
          <div className="bg-background-elevated rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Zap size={14} className="text-accent-purple" />
              Spendable XP
            </p>
            <p className="text-2xl font-bold text-white tabular-nums">
              {profile.spendable_xp.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Skill Breakdown                                                  */}
      {/* ================================================================ */}
      <section className="card space-y-5">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-accent-purple" />
          Skill Breakdown
        </h2>

        {profile.skill_xp && profile.skill_xp.length > 0 ? (
          <div className="space-y-4">
            {profile.skill_xp.map((skill) => (
              <SkillBar
                key={skill.skill_tree}
                skill={skill}
                maxXp={maxSkillXp}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No skill XP earned yet. Complete quests to build your skills!
          </p>
        )}
      </section>

      {/* ================================================================ */}
      {/* Soulbound Titles                                                 */}
      {/* ================================================================ */}
      <section className="card space-y-5">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Crown size={20} className="text-amber-400" />
          Soulbound Titles
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SKILL_TREES.map((tree) => {
            const title = SOULBOUND_TITLES[tree];
            const info = SKILL_TREE_INFO[tree];
            const earned = profile.titles.includes(title);

            return (
              <div
                key={tree}
                className={clsx(
                  "rounded-lg border p-4 flex items-center gap-3 transition-all",
                  earned
                    ? "border-amber-500/40 bg-amber-500/5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-surface-border bg-background-elevated opacity-60",
                )}
              >
                <div
                  className={clsx(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    earned ? "bg-amber-500/20" : "bg-surface",
                  )}
                >
                  {earned ? (
                    <Crown size={18} className="text-amber-400" />
                  ) : (
                    <Lock size={16} className="text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={clsx(
                      "text-sm font-semibold truncate",
                      earned ? "text-amber-300" : "text-gray-500",
                    )}
                  >
                    {title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {info.title} Branch
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* Stats                                                            */}
      {/* ================================================================ */}
      <section className="card space-y-5">
        <h2 className="text-xl font-semibold text-white">Stats</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Quests Completed */}
          <div className="bg-background-elevated rounded-lg p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center mx-auto mb-2">
              <Award size={20} className="text-accent-purple" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {profile.quests_completed}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Quests Completed
            </p>
          </div>

          {/* Badges Earned */}
          <div className="bg-background-elevated rounded-lg p-4 text-center">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center mx-auto mb-2">
              <Award size={20} className="text-accent-cyan" />
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">
              {profile.badges_earned}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              Badges Earned
            </p>
          </div>

          {/* KYC Status */}
          <div className="bg-background-elevated rounded-lg p-4 text-center">
            <div
              className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2",
                profile.kyc_verified
                  ? "bg-green-500/20"
                  : "bg-gray-500/20",
              )}
            >
              <Shield
                size={20}
                className={
                  profile.kyc_verified ? "text-green-400" : "text-gray-400"
                }
              />
            </div>
            <p
              className={clsx(
                "text-sm font-semibold",
                profile.kyc_verified ? "text-green-400" : "text-gray-400",
              )}
            >
              {profile.kyc_verified ? "Verified" : "Unverified"}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">
              KYC Status
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
