"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="card space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
        <p className="text-gray-400">
          An unexpected error occurred. Please try again.
        </p>
        {error.message && (
          <p className="rounded-lg bg-surface p-3 font-mono text-sm text-gray-500">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="btn-primary inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
