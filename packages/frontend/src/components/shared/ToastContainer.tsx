"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toastStore";

const ICON_MAP: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  info: Info,
  error: AlertTriangle,
};

const COLOR_MAP: Record<ToastType, string> = {
  success: "text-green-400",
  info: "text-accent-cyan",
  error: "text-red-400",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON_MAP[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto bg-background-card border border-surface-border rounded-lg shadow-xl px-4 py-3 max-w-sm flex items-start gap-3"
            >
              <Icon
                size={18}
                className={`flex-shrink-0 mt-0.5 ${COLOR_MAP[toast.type]}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{toast.message}</p>
                {toast.description && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
