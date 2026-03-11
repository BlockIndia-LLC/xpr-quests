"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Zap, AlertTriangle, History, ShoppingBag, Trophy } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useProfile } from "@/hooks/useProfile";
import { usePerks, useRedemptionHistory, redeemPerk } from "@/hooks/usePerks";
import { useToastStore } from "@/stores/toastStore";
import type { Perk } from "@xpr-quests/shared";
import clsx from "clsx";

function PerkCard({
  perk,
  spendableXp,
  onRedeem,
}: {
  perk: Perk;
  spendableXp: number;
  onRedeem: (perkId: number) => Promise<void>;
}) {
  const [redeeming, setRedeeming] = useState(false);
  const canAfford = spendableXp >= perk.xp_cost;
  const soldOut =
    perk.max_redemptions > 0 && perk.redeemed_count >= perk.max_redemptions;

  const handleRedeem = async () => {
    if (!canAfford || soldOut || redeeming) return;
    setRedeeming(true);
    try {
      await onRedeem(perk.perk_id);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="bg-background-card rounded-xl border border-surface-border p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center flex-shrink-0">
          <Gift size={20} className="text-accent-cyan" />
        </div>
        <span className="text-xs text-gray-500">{perk.partner}</span>
      </div>

      <h3 className="font-semibold text-white mb-1">{perk.title}</h3>
      <p className="text-sm text-gray-400 mb-4 flex-1">{perk.description}</p>

      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1 text-sm font-semibold text-accent-purple">
          <Zap size={14} />
          {perk.xp_cost} XP
        </span>
        {perk.max_redemptions > 0 && (
          <span className="text-xs text-gray-500">
            {perk.max_redemptions - perk.redeemed_count} left
          </span>
        )}
      </div>

      <button
        onClick={handleRedeem}
        disabled={!canAfford || soldOut || redeeming}
        className={clsx(
          "w-full py-2.5 rounded-lg text-sm font-medium transition-all",
          canAfford && !soldOut
            ? "bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30"
            : "bg-surface text-gray-500 cursor-not-allowed",
        )}
      >
        {soldOut
          ? "Sold Out"
          : !canAfford
            ? "Not Enough XP"
            : redeeming
              ? "Redeeming..."
              : "Redeem"}
      </button>
    </div>
  );
}

export default function RewardsPage() {
  const [tab, setTab] = useState<"shop" | "history">("shop");
  const { account, isConnected } = useWallet();
  const { data: profileData, mutate: mutateProfile } = useProfile(
    account ?? "",
  );
  const { data: perksData, error: perksError } = usePerks();
  const { data: historyData } = useRedemptionHistory();
  const addToast = useToastStore((s) => s.addToast);

  const profile = profileData?.data;
  const perksList = perksData?.data ?? [];
  const history = historyData?.data ?? [];
  const spendableXp = profile?.spendable_xp ?? 0;

  const handleRedeem = async (perkId: number) => {
    try {
      const result = await redeemPerk(perkId);
      addToast({
        type: "success",
        message: "Perk Redeemed!",
        description: `${result.data.xp_spent} XP spent. ${result.data.remaining_xp} XP remaining.`,
      });
      mutateProfile();
    } catch (err: any) {
      addToast({
        type: "error",
        message: "Redemption failed",
        description: err.message,
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Rewards Shop
        </h1>
        {isConnected && profile && (
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
            <Zap size={16} className="text-accent-purple" />
            <span className="text-sm font-semibold text-white">
              {spendableXp.toLocaleString()} XP
            </span>
            <span className="text-xs text-gray-400">available</span>
          </span>
        )}
      </div>

      {/* Season Rewards CTA */}
      <Link
        href="/rewards/seasons"
        className="mb-8 flex items-center justify-between bg-background-card rounded-xl border border-surface-border p-5 hover:border-accent-purple/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-purple/20 flex items-center justify-center">
            <Trophy size={20} className="text-accent-purple" />
          </div>
          <div>
            <p className="font-semibold text-white group-hover:text-accent-purple transition-colors">
              Season Rewards
            </p>
            <p className="text-sm text-gray-500">
              Claim XPR token rewards from completed seasons
            </p>
          </div>
        </div>
        <span className="text-gray-500 group-hover:text-accent-purple transition-colors">
          &rarr;
        </span>
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab("shop")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            tab === "shop"
              ? "bg-accent-purple text-white"
              : "bg-surface text-gray-400 hover:text-white border border-surface-border",
          )}
        >
          <ShoppingBag size={14} />
          Shop
        </button>
        <button
          onClick={() => setTab("history")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            tab === "history"
              ? "bg-accent-purple text-white"
              : "bg-surface text-gray-400 hover:text-white border border-surface-border",
          )}
        >
          <History size={14} />
          History
        </button>
      </div>

      {tab === "shop" ? (
        perksError ? (
          <div className="card text-center py-16">
            <AlertTriangle size={28} className="mx-auto text-red-400 mb-3" />
            <p className="text-gray-400">Failed to load perks.</p>
          </div>
        ) : perksList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {perksList.map((perk) => (
              <PerkCard
                key={perk.perk_id}
                perk={perk}
                spendableXp={spendableXp}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <Gift size={28} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">No perks available yet.</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((r) => (
              <div
                key={r.id}
                className="bg-background-card rounded-lg border border-surface-border p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {r.perk_title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.perk_partner} &middot;{" "}
                    {new Date(r.redeemed_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm text-accent-purple font-semibold">
                  -{r.xp_spent} XP
                </span>
              </div>
            ))
          ) : (
            <div className="card text-center py-16">
              <History size={28} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-400">No redemptions yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
