"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Flag,
  Gift,
  Calendar,
  Link2,
  RefreshCw,
  Loader2,
  Play,
  StopCircle,
  Trophy,
} from "lucide-react";
import { useWallet } from "@/components/wallet/WalletProvider";
import { apiFetch } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import type { Quest } from "@xpr-quests/shared";
import clsx from "clsx";

type Tab = "quests" | "analytics" | "reports" | "perks" | "seasons" | "chain-sync";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "quests", label: "Quest Approval", icon: CheckCircle },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "perks", label: "Perks", icon: Gift },
  { key: "seasons", label: "Seasons", icon: Calendar },
  { key: "chain-sync", label: "Chain Sync", icon: Link2 },
];

export default function AdminPage() {
  const { account, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("quests");
  const [draftQuests, setDraftQuests] = useState<Quest[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [chainSync, setChainSync] = useState<any>(null);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!isConnected) return;
    loadData();
  }, [isConnected, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case "quests": {
          const res = await apiFetch<{ data: Quest[] }>("/api/admin/quests");
          setDraftQuests(res.data ?? []);
          break;
        }
        case "analytics": {
          const res = await apiFetch<{ data: any[] }>("/api/admin/analytics");
          setAnalytics(res.data ?? []);
          break;
        }
        case "reports": {
          const res = await apiFetch<{ data: any[] }>("/api/admin/reports");
          setReports(res.data ?? []);
          break;
        }
        case "chain-sync": {
          const res = await apiFetch<{ data: any }>("/api/admin/chain-sync");
          setChainSync(res.data ?? null);
          break;
        }
        case "seasons": {
          const res = await apiFetch<{ data: any[] }>("/api/seasons");
          setSeasons(res.data ?? []);
          break;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveQuest = async (questId: number) => {
    try {
      await apiFetch(`/api/admin/quests/${questId}/approve`, {
        method: "POST",
      });
      addToast({ type: "success", message: "Quest approved" });
      setDraftQuests((prev) => prev.filter((q) => q.quest_id !== questId));
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    }
  };

  const rejectQuest = async (questId: number) => {
    try {
      await apiFetch(`/api/admin/quests/${questId}/reject`, { method: "POST" });
      addToast({ type: "success", message: "Quest rejected" });
      setDraftQuests((prev) => prev.filter((q) => q.quest_id !== questId));
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    }
  };

  const retryChainSync = async (itemId: number) => {
    try {
      setActionLoading(`retry-${itemId}`);
      await apiFetch(`/api/admin/chain-sync/${itemId}/retry`, {
        method: "POST",
      });
      addToast({ type: "success", message: "Queued for retry" });
      loadData();
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const activateSeason = async (seasonId: number) => {
    try {
      setActionLoading(`activate-${seasonId}`);
      await apiFetch(`/api/admin/seasons/${seasonId}/activate`, {
        method: "POST",
      });
      addToast({ type: "success", message: "Season activated" });
      loadData();
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const endSeason = async (seasonId: number) => {
    try {
      setActionLoading(`end-${seasonId}`);
      await apiFetch(`/api/seasons/${seasonId}/end`, { method: "POST" });
      addToast({ type: "success", message: "Season ended, rankings computed" });
      loadData();
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const distributeSeason = async (seasonId: number) => {
    try {
      setActionLoading(`distribute-${seasonId}`);
      await apiFetch(`/api/seasons/${seasonId}/distribute`, {
        method: "POST",
      });
      addToast({ type: "success", message: "Rewards distributed" });
      loadData();
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const resolveReport = async (reportId: number) => {
    try {
      await apiFetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
      });
      addToast({ type: "success", message: "Report resolved" });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      addToast({ type: "error", message: err.message });
    }
  };

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Shield size={32} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Admin Access</h2>
        <p className="text-gray-400">Connect an admin wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} className="text-accent-purple" />
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-accent-purple text-white"
                  : "bg-surface text-gray-400 hover:text-white border border-surface-border",
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="card mb-6 flex items-center gap-3 text-red-400">
          <AlertTriangle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-background-card rounded-lg border border-surface-border p-4 animate-pulse"
            >
              <div className="h-5 bg-surface rounded w-1/3 mb-2" />
              <div className="h-4 bg-surface rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Quest Approval Tab */}
          {activeTab === "quests" && (
            <div className="space-y-3">
              {draftQuests.length > 0 ? (
                draftQuests.map((quest) => (
                  <div
                    key={quest.quest_id}
                    className="bg-background-card rounded-lg border border-surface-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {quest.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {quest.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>By: @{quest.creator}</span>
                          <span>XP: {quest.xp_reward}</span>
                          <span>Tree: {quest.skill_tree}</span>
                          <span>
                            Type:{" "}
                            {
                              ["On-Chain", "Token Hold", "Governance", "Composite", "Community"][
                                quest.quest_type
                              ]
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => approveQuest(quest.quest_id)}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                          title="Approve"
                          aria-label="Approve quest"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => rejectQuest(quest.quest_id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          title="Reject"
                          aria-label="Reject quest"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <CheckCircle
                    size={28}
                    className="mx-auto text-green-400 mb-3"
                  />
                  <p className="text-gray-400">
                    No quests pending approval.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-3">
              {analytics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-surface-border">
                        <th className="pb-3 font-medium">Quest</th>
                        <th className="pb-3 font-medium">Tree</th>
                        <th className="pb-3 font-medium text-right">Starts</th>
                        <th className="pb-3 font-medium text-right">
                          Completions
                        </th>
                        <th className="pb-3 font-medium text-right">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((m, i) => (
                        <tr
                          key={i}
                          className="border-b border-surface-border/50"
                        >
                          <td className="py-3 text-white">
                            {m.title || `Quest #${m.quest_id}`}
                          </td>
                          <td className="py-3 text-gray-400">
                            {m.skill_tree}
                          </td>
                          <td className="py-3 text-gray-300 text-right">
                            {m.total_starts ?? 0}
                          </td>
                          <td className="py-3 text-gray-300 text-right">
                            {m.total_completions ?? 0}
                          </td>
                          <td className="py-3 text-gray-300 text-right">
                            {m.completion_rate
                              ? `${(m.completion_rate * 100).toFixed(1)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <BarChart3
                    size={28}
                    className="mx-auto text-gray-500 mb-3"
                  />
                  <p className="text-gray-400">No analytics data yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-3">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-background-card rounded-lg border border-surface-border p-5 flex items-start justify-between"
                  >
                    <div>
                      <p className="text-sm text-white">
                        <span className="text-gray-500">Reporter:</span>{" "}
                        @{report.reporter} &rarr;{" "}
                        <span className="text-red-400">
                          @{report.reported_user}
                        </span>
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {report.reason}
                      </p>
                      {report.evidence && (
                        <p className="text-xs text-gray-500 mt-1">
                          Evidence: {report.evidence}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => resolveReport(report.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 flex-shrink-0 ml-4"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <Flag size={28} className="mx-auto text-gray-500 mb-3" />
                  <p className="text-gray-400">No pending reports.</p>
                </div>
              )}
            </div>
          )}

          {/* Perks Tab — placeholder */}
          {activeTab === "perks" && (
            <div className="card text-center py-12">
              <Gift size={28} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-400">
                Perk management via API. Use POST /api/admin/perks to create.
              </p>
            </div>
          )}

          {/* Seasons Tab */}
          {activeTab === "seasons" && (
            <div className="space-y-4">
              {seasons.length > 0 ? (
                seasons.map((season: any) => (
                  <div
                    key={season.season_id}
                    className="bg-background-card rounded-lg border border-surface-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-white">
                            {season.title}
                          </h3>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              season.status === 0
                                ? "bg-blue-500/20 text-blue-400"
                                : season.status === 1
                                  ? "bg-green-500/20 text-green-400"
                                  : season.status === 2
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-accent-purple/20 text-accent-purple",
                            )}
                          >
                            {["Upcoming", "Active", "Ended", "Distributed"][
                              season.status
                            ] ?? "Unknown"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(season.start_time).toLocaleDateString()} —{" "}
                          {new Date(season.end_time).toLocaleDateString()} | Pool:{" "}
                          {season.reward_pool}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        {season.status === 0 && (
                          <button
                            onClick={() => activateSeason(season.season_id)}
                            disabled={actionLoading === `activate-${season.season_id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                          >
                            {actionLoading === `activate-${season.season_id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} />
                            )}
                            Start
                          </button>
                        )}
                        {season.status === 1 && (
                          <button
                            onClick={() => endSeason(season.season_id)}
                            disabled={actionLoading === `end-${season.season_id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-colors"
                          >
                            {actionLoading === `end-${season.season_id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <StopCircle size={14} />
                            )}
                            End
                          </button>
                        )}
                        {season.status === 2 && (
                          <button
                            onClick={() => distributeSeason(season.season_id)}
                            disabled={
                              actionLoading === `distribute-${season.season_id}`
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-purple/20 text-accent-purple text-sm hover:bg-accent-purple/30 transition-colors"
                          >
                            {actionLoading ===
                            `distribute-${season.season_id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trophy size={14} />
                            )}
                            Distribute
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card text-center py-12">
                  <Calendar
                    size={28}
                    className="mx-auto text-gray-500 mb-3"
                  />
                  <p className="text-gray-400">No seasons created yet.</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use POST /api/admin/seasons to create one.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Chain Sync Tab */}
          {activeTab === "chain-sync" && chainSync && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-background-card rounded-lg border border-surface-border p-5 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {chainSync.pending}
                  </p>
                </div>
                <div className="bg-background-card rounded-lg border border-surface-border p-5 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {chainSync.completed}
                  </p>
                </div>
                <div className="bg-background-card rounded-lg border border-surface-border p-5 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Failed
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {chainSync.failed}
                  </p>
                </div>
              </div>

              {/* Recent failures */}
              {chainSync.recent_failures?.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Recent Failures
                  </h3>
                  <div className="space-y-2">
                    {chainSync.recent_failures.map((item: any) => (
                      <div
                        key={item.id}
                        className="bg-background-card rounded-lg border border-red-500/20 p-4 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-white">
                              {item.action_type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.attempts}/{item.max_attempts} attempts
                            </span>
                          </div>
                          <p className="text-xs text-red-400 truncate mt-1">
                            {item.last_error}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => retryChainSync(item.id)}
                          disabled={actionLoading === `retry-${item.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan/20 text-accent-cyan text-sm hover:bg-accent-cyan/30 transition-colors ml-4 flex-shrink-0"
                        >
                          {actionLoading === `retry-${item.id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          Retry
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-8">
                  <CheckCircle
                    size={24}
                    className="mx-auto text-green-400 mb-2"
                  />
                  <p className="text-gray-400 text-sm">
                    No failed sync items.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "chain-sync" && !chainSync && !loading && (
            <div className="card text-center py-12">
              <Link2 size={28} className="mx-auto text-gray-500 mb-3" />
              <p className="text-gray-400">
                Chain sync data unavailable.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
