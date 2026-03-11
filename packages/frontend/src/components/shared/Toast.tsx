"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

const TOAST_CONFIG: Record<
  ToastProps["type"],
  { icon: typeof CheckCircle; borderColor: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle,
    borderColor: "border-green-500",
    iconColor: "text-green-400",
  },
  error: {
    icon: XCircle,
    borderColor: "border-red-500",
    iconColor: "text-red-400",
  },
  info: {
    icon: Info,
    borderColor: "border-accent-purple",
    iconColor: "text-accent-purple",
  },
};

export default function Toast({
  message,
  type,
  onClose,
  duration = 5000,
}: ToastProps) {
  const config = TOAST_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        role="alert"
        aria-live="assertive"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-3 bg-background-card border-l-4 ${config.borderColor} rounded-lg px-4 py-3 shadow-xl shadow-black/30 sm:max-w-sm`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
        <p className="text-sm text-white flex-grow">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
