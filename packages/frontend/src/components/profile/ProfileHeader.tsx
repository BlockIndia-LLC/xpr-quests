"use client";

import { Zap, Coins } from "lucide-react";
import { UserProfile } from "@xpr-quests/shared";
import TierBadge from "@/components/profile/TierBadge";
import XPBar from "@/components/profile/XPBar";

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="bg-background-card rounded-xl border border-surface-border overflow-hidden">
      {/* Gradient top border */}
      <div className="h-1.5 bg-gradient-to-r from-accent-purple to-accent-cyan" />

      <div className="p-6">
        {/* Account name + tier */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-white">
            @{profile.account}
          </h1>
          <TierBadge tier={profile.tier} size="md" />
        </div>

        {/* Level display */}
        <p className="text-sm text-gray-400 mb-3">
          Level{" "}
          <span className="text-white font-semibold">{profile.level}</span>
        </p>

        {/* XP progress bar */}
        <div className="mb-6">
          <XPBar currentXP={profile.lifetime_xp} level={profile.level} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lifetime XP */}
          <div className="bg-surface rounded-lg p-4 border border-surface-border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-accent-purple" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Lifetime XP
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {profile.lifetime_xp.toLocaleString()}
            </p>
          </div>

          {/* Spendable XP */}
          <div className="bg-surface rounded-lg p-4 border border-surface-border">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-accent-cyan" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                Spendable XP
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {profile.spendable_xp.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
