"use client";

import { Zap, Target, Code, Signal, Users } from "lucide-react";
import { Quest, QuestStatus, SKILL_TREE_INFO } from "@xpr-quests/shared";

interface QuestDetailProps {
  quest: Quest;
}

const STATUS_CONFIG: Record<
  QuestStatus,
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

export default function QuestDetail({ quest }: QuestDetailProps) {
  const skillInfo =
    SKILL_TREE_INFO[quest.skill_tree as keyof typeof SKILL_TREE_INFO];
  const statusConfig = STATUS_CONFIG[quest.status];

  const infoItems = [
    {
      icon: Zap,
      label: "XP Reward",
      value: `${quest.xp_reward} XP`,
      color: "text-accent-purple",
    },
    {
      icon: Target,
      label: "Required Actions",
      value: quest.required_count.toString(),
      color: "text-accent-cyan",
    },
    {
      icon: Signal,
      label: "Difficulty",
      value: quest.difficulty || "Standard",
      color: "text-yellow-400",
    },
    {
      icon: Code,
      label: "Target Contract",
      value: quest.target_contract || "N/A",
      color: "text-gray-300",
    },
    {
      icon: Users,
      label: "Total Completions",
      value: quest.completed_count.toLocaleString(),
      color: "text-gray-300",
    },
  ];

  return (
    <div className="relative">
      {/* Status badge */}
      <div className="absolute top-0 right-0">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {infoItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-surface rounded-lg p-3"
          >
            <div className={`p-2 rounded-lg bg-background-card ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {item.label}
              </p>
              <p className="text-sm font-medium text-white">{item.value}</p>
            </div>
          </div>
        ))}

        {/* Skill tree pill - special rendering */}
        {skillInfo && (
          <div className="flex items-center gap-3 bg-surface rounded-lg p-3">
            <div
              className="p-2 rounded-lg bg-background-card"
              style={{ color: skillInfo.color }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Skill Tree
              </p>
              <span
                className="skill-pill mt-0.5 text-xs"
                style={{
                  backgroundColor: `${skillInfo.color}20`,
                  color: skillInfo.color,
                }}
              >
                {skillInfo.title}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
