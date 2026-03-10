"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Timer, Trophy, ArrowRight } from "lucide-react";
import type { Season } from "@xpr-quests/shared";
import clsx from "clsx";

interface SeasonBannerProps {
  season: Season;
  compact?: boolean;
}

function calculateTimeLeft(endTime: string) {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, ended: true };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return { days, hours, minutes, ended: false };
}

export function SeasonBanner({ season, compact = false }: SeasonBannerProps) {
  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(season.end_time),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(season.end_time));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [season.end_time]);

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-accent-purple/10 to-accent-cyan/10 rounded-lg border border-accent-purple/20 p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Timer size={16} className="text-accent-cyan flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">
            {season.title}
          </span>
          {!timeLeft.ended && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {timeLeft.days}d {timeLeft.hours}h left
            </span>
          )}
        </div>
        <Link
          href={`/leaderboard?type=season`}
          className="text-xs text-accent-purple hover:text-accent-cyan transition-colors flex-shrink-0"
        >
          Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent-purple/20 bg-gradient-to-r from-accent-purple/10 via-background-card to-accent-cyan/10 p-6">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent-purple/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-accent-cyan/5 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-accent-purple" />
            <h3 className="text-lg font-bold text-white">{season.title}</h3>
          </div>
          <p className="text-sm text-gray-400">{season.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              Reward Pool:{" "}
              <span className="text-accent-cyan font-semibold">
                {season.reward_pool}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Countdown */}
          {timeLeft.ended ? (
            <span className="text-sm font-semibold text-red-400">
              Season Ended
            </span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {timeLeft.days}
                </p>
                <p className="text-[10px] text-gray-500 uppercase">Days</p>
              </div>
              <span className="text-gray-600 text-xl">:</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {timeLeft.hours}
                </p>
                <p className="text-[10px] text-gray-500 uppercase">Hrs</p>
              </div>
              <span className="text-gray-600 text-xl">:</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {timeLeft.minutes}
                </p>
                <p className="text-[10px] text-gray-500 uppercase">Min</p>
              </div>
            </div>
          )}

          <Link
            href="/leaderboard"
            className={clsx(
              "inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30",
            )}
          >
            Leaderboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
