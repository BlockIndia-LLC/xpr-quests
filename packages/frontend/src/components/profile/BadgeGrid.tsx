"use client";

import { Award } from "lucide-react";

interface Badge {
  name: string;
  image_url?: string;
  earned_at: string;
}

interface BadgeGridProps {
  badges: Badge[];
  emptyCount?: number;
}

export default function BadgeGrid({ badges, emptyCount = 0 }: BadgeGridProps) {
  const emptySlots = Array.from({ length: emptyCount }, (_, i) => i);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Earned badges */}
      {badges.map((badge, index) => (
        <div
          key={`${badge.name}-${index}`}
          className="bg-surface rounded-lg border border-surface-border p-3 flex flex-col items-center aspect-square justify-center transition-all duration-200 hover:border-accent-purple/40"
        >
          {badge.image_url ? (
            <img
              src={badge.image_url}
              alt={badge.name}
              className="w-16 h-16 rounded-lg object-cover mb-2"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-background-card flex items-center justify-center mb-2">
              <Award className="w-8 h-8 text-accent-purple" />
            </div>
          )}
          <p className="text-xs font-medium text-white text-center truncate w-full">
            {badge.name}
          </p>
        </div>
      ))}

      {/* Empty placeholder slots */}
      {emptySlots.map((index) => (
        <div
          key={`empty-${index}`}
          className="rounded-lg border-2 border-dashed border-surface-border p-3 flex flex-col items-center aspect-square justify-center opacity-40"
        >
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-2">
            <span className="text-2xl text-gray-600 font-bold">?</span>
          </div>
          <p className="text-xs text-gray-600 text-center">Locked</p>
        </div>
      ))}
    </div>
  );
}
