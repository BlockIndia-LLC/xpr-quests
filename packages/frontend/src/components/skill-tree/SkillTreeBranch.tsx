"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { QuestNode } from "./QuestNode";
import type { SkillTreeWithProgress } from "@xpr-quests/shared";
import clsx from "clsx";

interface SkillTreeBranchProps {
  tree: SkillTreeWithProgress;
}

export function SkillTreeBranch({ tree }: SkillTreeBranchProps) {
  const { quests, color, completion_title, title_earned } = tree;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-1 overflow-x-auto pb-4 pt-2 px-2"
    >
      {quests.map((quest, i) => {
        // Find previous quest title for locked tooltip
        const prereqTitle =
          i > 0 && quest.status === "locked"
            ? quests[i - 1]?.title
            : undefined;

        return (
          <motion.div
            key={quest.quest_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex items-center"
          >
            <QuestNode
              quest={quest}
              color={color}
              prereqTitle={prereqTitle}
            />

            {/* Connector line */}
            {i < quests.length - 1 && (
              <div className="flex items-center mx-1 mt-[-24px]">
                <div
                  className={clsx(
                    "w-6 h-0.5",
                    quest.status === "completed"
                      ? ""
                      : "border-t border-dashed border-gray-600",
                  )}
                  style={
                    quest.status === "completed"
                      ? { backgroundColor: color }
                      : undefined
                  }
                />
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Title node at the end */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: quests.length * 0.1, duration: 0.3 }}
        className="flex items-center"
      >
        {/* Connector to title */}
        <div className="flex items-center mx-1 mt-[-24px]">
          <div
            className={clsx(
              "w-6 h-0.5",
              title_earned
                ? ""
                : "border-t border-dashed border-gray-600",
            )}
            style={
              title_earned ? { backgroundColor: color } : undefined
            }
          />
        </div>

        {/* Title badge */}
        <div className="flex flex-col items-center gap-2 w-24">
          <div
            className={clsx(
              "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
              title_earned ? "shadow-lg" : "opacity-40",
            )}
            style={{
              borderColor: title_earned ? "#facc15" : "#4b5563",
              backgroundColor: title_earned
                ? "rgba(250, 204, 21, 0.15)"
                : "transparent",
              boxShadow: title_earned
                ? "0 0 20px rgba(250, 204, 21, 0.3)"
                : undefined,
            }}
          >
            <Crown
              size={22}
              className={title_earned ? "text-yellow-400" : "text-gray-600"}
            />
          </div>
          <p
            className={clsx(
              "text-xs text-center font-semibold leading-tight",
              title_earned ? "text-yellow-400" : "text-gray-600",
            )}
          >
            {completion_title}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
