"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Zap } from "lucide-react";
import type { SkillTreeQuestNode } from "@xpr-quests/shared";
import clsx from "clsx";

interface QuestNodeProps {
  quest: SkillTreeQuestNode;
  color: string;
  prereqTitle?: string;
}

export function QuestNode({ quest, color, prereqTitle }: QuestNodeProps) {
  const isClickable = quest.status !== "locked";

  const nodeContent = (
    <motion.div
      whileHover={isClickable ? { scale: 1.05 } : undefined}
      className={clsx(
        "relative flex flex-col items-center gap-2 w-24",
        !isClickable && "cursor-default",
        isClickable && "cursor-pointer",
      )}
    >
      {/* Node circle */}
      <div
        className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all relative",
          quest.status === "completed" && "shadow-lg",
          quest.status === "in_progress" && "animate-glow-pulse",
          quest.status === "locked" && "opacity-40",
        )}
        style={{
          borderColor:
            quest.status === "completed" || quest.status === "in_progress"
              ? color
              : quest.status === "available"
                ? "#ffffff"
                : "#4b5563",
          backgroundColor:
            quest.status === "completed"
              ? `${color}30`
              : quest.status === "in_progress"
                ? `${color}15`
                : "transparent",
          boxShadow:
            quest.status === "completed"
              ? `0 0 20px ${color}40`
              : undefined,
        }}
      >
        {quest.status === "completed" ? (
          <CheckCircle2 size={24} style={{ color }} />
        ) : quest.status === "locked" ? (
          <Lock size={18} className="text-gray-500" />
        ) : (
          <Zap size={20} style={{ color: quest.status === "available" ? "#ffffff" : color }} />
        )}
      </div>

      {/* Quest title */}
      <p
        className={clsx(
          "text-xs text-center font-medium leading-tight line-clamp-2",
          quest.status === "completed" && "text-white",
          quest.status === "in_progress" && "text-gray-200",
          quest.status === "available" && "text-gray-300",
          quest.status === "locked" && "text-gray-600",
        )}
      >
        {quest.title}
      </p>

      {/* XP reward */}
      <span
        className={clsx(
          "text-[10px] font-medium",
          quest.status === "locked" ? "text-gray-600" : "text-gray-500",
        )}
      >
        {quest.xp_reward} XP
      </span>

      {/* Locked tooltip */}
      {quest.status === "locked" && prereqTitle && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-gray-500 bg-background-elevated px-2 py-0.5 rounded">
            Requires: {prereqTitle}
          </span>
        </div>
      )}
    </motion.div>
  );

  if (isClickable) {
    return (
      <Link href={`/quests/${quest.quest_id}`} className="group">
        {nodeContent}
      </Link>
    );
  }

  return <div className="group">{nodeContent}</div>;
}
