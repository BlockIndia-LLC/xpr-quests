"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Zap,
  CheckCircle2,
  Loader2,
  Calendar,
  Medal,
  Gift,
} from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { fetcher, apiFetch } from "@/lib/api";
import { buildClaimSeasonRewardAction, signAndSubmit } from "@/lib/contracts";
import { SEASON_REWARD_TIERS, type ApiResponse } from "@xpr-quests/shared";
import clsx from "clsx";

interface Season {
  season_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  reward_pool: string;
  status: number; // 0=upcoming, 1=active, 2=ended, 3=distributed
}

interface SeasonReward {
  id: number;
  season_id: number;
  user_name: string;
  rank: number;
  reward_amount: string;
  claimed: boolean;
  claimed_at: string | null;
  tx_id: string | null;
}

function statusLabel(status: number): { label: string; className: string } {
  switch (status) {
    case 0:
      return { label: "Upcoming", className: "bg-blue-500/20 text-blue-400" };
    case 1:
      return { label: "Active", className: "bg-green-500/20 text-green-400" };
    case 2:
      return { label: "Ended", className: "bg-gray-500/20 text-gray-400" };
    case 3:
      return {
        label: "Rewards Available",
        className: "bg-accent-purple/20 text-accent-purple",
      };
    default:
      return { label: "Unknown", className: "bg-gray-500/20 text-gray-400" };
  }
}

function SeasonCard({
  season,
  reward,
  onClaim,
  claimingId,
}: {
  season: Season;
  reward: SeasonReward | null;
  onClaim: (seasonId: number) => void;
  claimingId: number | null;
}) {
  const status = statusLabel(season.status);
  const claiming = claimingId === season.season_id;

  return (
    <div className="bg-background-card rounded-xl border border-surface-border p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center flex-shrink-0">
            <Trophy size={20} className="text-accent-purple" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">
              {season.title}
            </h3>
            <p className="text-xs text-gray-500">{season.description}</p>
          </div>
        </div>
        <span
          className={clsx(
            "px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Calendar size={14} />
          <span>
            {new Date(season.start_time).toLocaleDateString()} -{" "}
            {new Date(season.end_time).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Gift size={14} />
          <span>Pool: {season.reward_pool}</span>
        </div>
      </div>

      {reward && (
        <div
          className={clsx(
            "rounded-lg p-4 flex items-center justify-between",
            reward.claimed
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-accent-purple/10 border border-accent-purple/30",
          )}
        >
          <div className="flex items-center gap-3">
            <Medal
              size={20}
              className={reward.claimed ? "text-green-400" : "text-accent-purple"}
            />
            <div>
              <p
                className={clsx(
                  "font-semibold",
                  reward.claimed ? "text-green-400" : "text-white",
                )}
              >
                #{reward.rank} — {reward.reward_amount}
              </p>
              <p className="text-xs text-gray-500">
                {reward.claimed
                  ? `Claimed ${new Date(reward.claimed_at!).toLocaleDateString()}`
                  : "Ready to claim"}
              </p>
            </div>
          </div>

          {!reward.claimed && (
            <button
              onClick={() => onClaim(season.season_id)}
              disabled={claiming}
              className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Claim
                </>
              )}
            </button>
          )}

          {reward.claimed && (
            <CheckCircle2 size={20} className="text-green-400" />
          )}
        </div>
      )}
    </div>
  );
}

export default function SeasonRewardsPage() {
  const { account, isConnected, session } = useWallet();
  const { mutate } = useSWRConfig();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: seasonsRes, isLoading: seasonsLoading } = useSWR<ApiResponse<Season[]>>(
    "/api/seasons",
    fetcher,
  );

  // Fetch rewards for each distributed season
  const seasons = seasonsRes?.data ?? [];
  const distributedSeasons = seasons.filter((s) => s.status === 3);

  // Fetch user rewards for all distributed seasons
  const { data: rewardsMap } = useSWR<Record<number, SeasonReward | null>>(
    isConnected && account && distributedSeasons.length > 0
      ? `season-rewards:${account}`
      : null,
    async () => {
      const results: Record<number, SeasonReward | null> = {};
      await Promise.all(
        distributedSeasons.map(async (s) => {
          try {
            const res = await apiFetch<ApiResponse<SeasonReward | null>>(
              `/api/seasons/${s.season_id}/rewards`,
            );
            results[s.season_id] = res.data;
          } catch {
            results[s.season_id] = null;
          }
        }),
      );
      return results;
    },
  );

  const handleClaim = async (seasonId: number) => {
    if (!session || !account || claimingId) return;
    setClaimingId(seasonId);
    setError(null);

    try {
      // 1. Sign on-chain via wallet
      const action = buildClaimSeasonRewardAction(account, seasonId);
      const txId = await signAndSubmit(session, action);

      // 2. Confirm with backend
      await apiFetch(`/api/seasons/${seasonId}/claim-confirm`, {
        method: "POST",
        body: JSON.stringify({ tx_id: txId }),
      });

      // Revalidate
      mutate(`season-rewards:${account}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/rewards"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-accent-purple transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to Rewards
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Season Rewards</h1>
      </div>

      {/* Reward tier info */}
      <div className="card mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Reward Tiers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SEASON_REWARD_TIERS.map((tier) => (
            <div
              key={tier.rank_start}
              className="bg-background-elevated rounded-lg p-4 text-center"
            >
              <p className="text-sm text-gray-400">
                #{tier.rank_start} - #{tier.rank_end}
              </p>
              <p className="text-lg font-bold text-accent-purple">
                {tier.xpr_per_user}
              </p>
              <p className="text-xs text-gray-500">per user</p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="card text-center py-16">
          <Trophy size={28} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">
            Connect your wallet to view season rewards.
          </p>
        </div>
      ) : seasonsLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-background-card rounded-xl border border-surface-border p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-surface rounded" />
                    <div className="h-3 w-60 bg-surface rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-surface rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-4 bg-surface rounded" />
                <div className="h-4 bg-surface rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : seasons.length === 0 ? (
        <div className="card text-center py-16">
          <Trophy size={28} className="mx-auto text-gray-500 mb-3" />
          <p className="text-gray-400">No seasons yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {seasons.map((season) => (
            <SeasonCard
              key={season.season_id}
              season={season}
              reward={rewardsMap?.[season.season_id] ?? null}
              onClaim={handleClaim}
              claimingId={claimingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
