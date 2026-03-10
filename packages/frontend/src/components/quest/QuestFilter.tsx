"use client";

import { SKILL_TREE_INFO } from "@xpr-quests/shared";

interface QuestFilterProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export default function QuestFilter({
  activeFilter,
  onFilterChange,
}: QuestFilterProps) {
  const skillTrees = Object.entries(SKILL_TREE_INFO);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {/* All pill */}
      <button
        onClick={() => onFilterChange(null)}
        className={`flex-shrink-0 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          activeFilter === null
            ? "bg-accent-purple text-white"
            : "bg-surface text-gray-400 hover:text-white hover:bg-surface-hover"
        }`}
      >
        All
      </button>

      {/* Skill tree pills */}
      {skillTrees.map(([key, info]) => (
        <button
          key={key}
          onClick={() => onFilterChange(key)}
          className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeFilter === key
              ? "bg-accent-purple text-white"
              : "bg-surface text-gray-400 hover:text-white hover:bg-surface-hover"
          }`}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: info.color }}
          />
          {info.title}
        </button>
      ))}
    </div>
  );
}
