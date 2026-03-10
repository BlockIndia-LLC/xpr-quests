"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Zap, Trophy, Star, ArrowRight, AlertTriangle } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useProfile } from "@/hooks/useProfile";
import { useQuests } from "@/hooks/useQuests";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  SKILL_TREE_INFO,
  QuestStatus,
  xpProgress,
  xpForNextLevel,
  xpForLevel,
  type Quest,
} from "@xpr-quests/shared";

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-5 bg-surface rounded w-3/4 mb-3" />
      <div className="h-4 bg-surface rounded w-full mb-2" />
      <div className="h-4 bg-surface rounded w-1/2 mb-4" />
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-surface rounded-full" />
        <div className="h-6 w-14 bg-surface rounded-full" />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="card animate-pulse flex flex-col items-center gap-2 py-5">
      <div className="h-4 w-20 bg-surface rounded" />
      <div className="h-8 w-24 bg-surface rounded" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini quest card
// ---------------------------------------------------------------------------

function QuestMiniCard({ quest }: { quest: Quest }) {
  const skillInfo =
    SKILL_TREE_INFO[quest.skill_tree as keyof typeof SKILL_TREE_INFO];

  return (
    <Link href={`/quests/${quest.quest_id}`}>
      <div className="card card-hover cursor-pointer group">
        <h3 className="font-semibold text-lg text-white group-hover:text-accent-purple transition-colors mb-1 truncate">
          {quest.title}
        </h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
          {quest.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {skillInfo && (
            <span
              className="skill-pill"
              style={{
                backgroundColor: `${skillInfo.color}20`,
                color: skillInfo.color,
              }}
            >
              {skillInfo.title}
            </span>
          )}
          <span className="skill-pill bg-accent-purple/20 text-accent-purple">
            <Zap size={12} className="mr-1" />
            {quest.xp_reward} XP
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Hero section (not connected)
// ---------------------------------------------------------------------------

function HeroSection({ onConnect }: { onConnect: () => void }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent-purple/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-cyan/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-purple bg-clip-text text-transparent">
            Earn XP. Collect Badges.
          </span>
          <br />
          <span className="text-white">Build Reputation.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          XPR Quests is the first gamification platform on XPR Network. Complete
          on-chain quests, earn soulbound XP, collect NFT badges, and climb the
          leaderboards.
        </p>

        <button
          onClick={onConnect}
          className="btn-primary text-lg px-10 py-4 bg-gradient-to-r from-accent-purple to-accent-cyan hover:opacity-90 transition-opacity"
        >
          Connect Wallet
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            { icon: Zap, label: "Earn Soulbound XP" },
            { icon: Trophy, label: "Climb Leaderboards" },
            { icon: Star, label: "Collect NFT Badges" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-surface-border text-sm text-gray-300"
            >
              <Icon size={16} className="text-accent-purple" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Connected dashboard
// ---------------------------------------------------------------------------

function Dashboard({
  account,
}: {
  account: string;
}) {
  const { data: profileData, isLoading: profileLoading, error: profileError } = useProfile(account);
  const { data: questsData, isLoading: questsLoading, error: questsError } = useQuests({
    status: QuestStatus.ACTIVE,
    limit: 6,
  });

  const profile = profileData?.data;
  const quests = questsData?.data ?? [];

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

  if (profileError || questsError) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="card space-y-4 py-12 text-center">
          <AlertTriangle size={32} className="mx-auto text-red-400" />
          <h2 className="text-lg font-semibold text-white">
            Failed to load dashboard
          </h2>
          <p className="text-sm text-gray-400">
            {profileError?.message ||
              questsError?.message ||
              "Unable to fetch data from the server."}
          </p>
          <p className="text-xs text-gray-500">
            Make sure the backend is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome banner */}
      <section className="card glow-border">
        <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold text-white mb-6">@{account}</h2>

        {profileLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lifetime XP */}
            <div className="bg-background-elevated rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Zap size={14} className="text-accent-cyan" />
                Lifetime XP
              </p>
              <p className="text-3xl font-bold text-white">
                {profile.lifetime_xp.toLocaleString()}
              </p>
            </div>

            {/* Level + progress */}
            <div className="bg-background-elevated rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Trophy size={14} className="text-accent-purple" />
                Level
              </p>
              <p className="text-3xl font-bold text-white mb-2">
                {profile.level}
              </p>
              <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-purple to-accent-cyan rounded-full animate-progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {profile.lifetime_xp - currentLevelXp} /{" "}
                {nextLevelXp - currentLevelXp} XP to next
              </p>
            </div>

            {/* Tier */}
            <div className="bg-background-elevated rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Star size={14} className="text-yellow-400" />
                Tier
              </p>
              <p className="text-3xl font-bold text-white">
                {profile.tier_name}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Complete your first quest to start earning XP!
          </p>
        )}
      </section>

      {/* Active quests section */}
      {profile && profile.quests_completed > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              Your Active Quests
            </h3>
            <Link
              href="/quests"
              className="text-sm text-accent-purple hover:text-accent-cyan transition-colors flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-sm text-gray-400">
            You have completed{" "}
            <span className="text-accent-cyan font-medium">
              {profile.quests_completed}
            </span>{" "}
            quest{profile.quests_completed !== 1 && "s"} so far.{" "}
            <Link
              href="/quests"
              className="text-accent-purple hover:underline"
            >
              Browse quests to find more.
            </Link>
          </p>
        </section>
      )}

      {/* Available quests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Available Quests
          </h3>
          <Link
            href="/quests"
            className="text-sm text-accent-purple hover:text-accent-cyan transition-colors flex items-center gap-1"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {questsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : quests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quests.map((quest) => (
              <QuestMiniCard key={quest.quest_id} quest={quest} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-400">
              No quests available right now. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function HomePage() {
  const { isConnected, isLoading, account, login } = useWallet();

  // Connect WebSocket for live updates
  useWebSocket(account);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-48 bg-surface rounded animate-pulse" />
          <div className="h-4 w-72 bg-surface rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isConnected || !account) {
    return <HeroSection onConnect={login} />;
  }

  return <Dashboard account={account} />;
}
