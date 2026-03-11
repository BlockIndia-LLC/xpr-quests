"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Send, AlertTriangle, Eye } from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useProfile } from "@/hooks/useProfile";
import { apiFetch } from "@/lib/api";
import {
  SKILL_TREE_INFO,
  SKILL_TREES,
  QuestType,
  Tier,
} from "@xpr-quests/shared";
import { useToastStore } from "@/stores/toastStore";
import clsx from "clsx";

const QUEST_TYPES = [
  { value: QuestType.ONCHAIN_ACTION, label: "On-Chain Action" },
  { value: QuestType.TOKEN_HOLD, label: "Token Hold" },
  { value: QuestType.GOVERNANCE, label: "Governance" },
  { value: QuestType.COMMUNITY_VERIFIED, label: "Community Verified" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"];

export default function CreateQuestPage() {
  const router = useRouter();
  const { account, isConnected } = useWallet();
  const { data: profileData } = useProfile(account ?? "");
  const profile = profileData?.data;
  const addToast = useToastStore((s) => s.addToast);

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    quest_type: QuestType.ONCHAIN_ACTION,
    target_contract: "",
    target_action: "",
    required_count: 1,
    xp_reward: 50,
    skill_tree: "defi",
    difficulty: "beginner",
    kyc_required: false,
  });

  const canCreate = profile && (profile.tier ?? 0) >= Tier.EXPLORER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/quests/create", {
        method: "POST",
        body: JSON.stringify(form),
      });
      addToast({ type: "success", message: "Quest submitted for review!" });
      router.push("/quests");
    } catch (err: any) {
      addToast({
        type: "error",
        message: "Failed to create quest",
        description: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertTriangle size={32} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
        <p className="text-gray-400">
          Connect your wallet to create community quests.
        </p>
      </div>
    );
  }

  if (profile && !canCreate) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <AlertTriangle size={32} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          Explorer Tier Required
        </h2>
        <p className="text-gray-400">
          You need 1,000+ lifetime XP (Explorer tier) to create quests. You
          currently have {profile.lifetime_xp.toLocaleString()} XP.
        </p>
      </div>
    );
  }

  const skillInfo =
    SKILL_TREE_INFO[form.skill_tree as keyof typeof SKILL_TREE_INFO];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">
        Create Quest
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Swap Master"
              maxLength={100}
              required
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Describe what users need to do..."
              maxLength={500}
              rows={3}
              required
              className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple resize-none"
            />
          </div>

          {/* Quest Type + Skill Tree */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Quest Type
              </label>
              <select
                value={form.quest_type}
                onChange={(e) =>
                  setForm({ ...form, quest_type: parseInt(e.target.value) })
                }
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-purple"
              >
                {QUEST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Skill Tree
              </label>
              <select
                value={form.skill_tree}
                onChange={(e) =>
                  setForm({ ...form, skill_tree: e.target.value })
                }
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-purple"
              >
                {SKILL_TREES.map((tree) => (
                  <option key={tree} value={tree}>
                    {SKILL_TREE_INFO[tree].title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contract + Action (hidden for community verified) */}
          {form.quest_type !== QuestType.COMMUNITY_VERIFIED && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Target Contract
                </label>
                <input
                  type="text"
                  value={form.target_contract}
                  onChange={(e) =>
                    setForm({ ...form, target_contract: e.target.value })
                  }
                  placeholder="e.g. metalx.swap"
                  required
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Target Action
                </label>
                <input
                  type="text"
                  value={form.target_action}
                  onChange={(e) =>
                    setForm({ ...form, target_action: e.target.value })
                  }
                  placeholder="e.g. swap"
                  required
                  className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple"
                />
              </div>
            </div>
          )}

          {/* Required Count + XP Reward + Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Required Count
              </label>
              <input
                type="number"
                value={form.required_count}
                onChange={(e) =>
                  setForm({
                    ...form,
                    required_count: parseInt(e.target.value) || 1,
                  })
                }
                min={1}
                max={10000}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                XP Reward
              </label>
              <input
                type="number"
                value={form.xp_reward}
                onChange={(e) =>
                  setForm({
                    ...form,
                    xp_reward: parseInt(e.target.value) || 10,
                  })
                }
                min={10}
                max={1000}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={(e) =>
                  setForm({ ...form, difficulty: e.target.value })
                }
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-purple"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KYC Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.kyc_required}
              onChange={(e) =>
                setForm({ ...form, kyc_required: e.target.checked })
              }
              className="w-4 h-4 rounded border-surface-border bg-surface text-accent-purple focus:ring-accent-purple"
            />
            <span className="text-sm text-gray-300">
              Require KYC verification
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={16} />
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Community quests start in draft status and require admin approval
            before becoming active.
          </p>
        </form>

        {/* Live Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-400">
                Preview
              </span>
            </div>
            <div className="bg-background-card rounded-xl border border-surface-border p-5">
              <h3 className="font-semibold text-lg text-white mb-2 truncate">
                {form.title || "Quest Title"}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                {form.description || "Quest description..."}
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
                    {skillInfo.title.split(" ")[0]}
                  </span>
                )}
                <span className="skill-pill bg-accent-purple/20 text-accent-purple">
                  <Zap size={12} className="mr-1" />
                  {form.xp_reward}
                </span>
                <span
                  className={clsx(
                    "skill-pill capitalize",
                    form.difficulty === "beginner" &&
                      "text-green-400 bg-green-400/15",
                    form.difficulty === "intermediate" &&
                      "text-yellow-400 bg-yellow-400/15",
                    form.difficulty === "advanced" &&
                      "text-red-400 bg-red-400/15",
                    form.difficulty === "expert" &&
                      "text-purple-400 bg-purple-400/15",
                  )}
                >
                  {form.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
