"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function QuestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[QuestsError]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-accent-purple"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
      <div className="card space-y-4 py-16 text-center">
        <AlertTriangle size={32} className="mx-auto text-red-400" />
        <h2 className="text-xl font-bold text-white">Failed to load quests</h2>
        <p className="text-gray-400">
          There was a problem loading the quest data. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    </div>
  );
}
