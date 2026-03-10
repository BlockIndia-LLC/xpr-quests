"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface LevelUpAnimationProps {
  level: number;
  onComplete?: () => void;
}

export function LevelUpAnimation({ level, onComplete }: LevelUpAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {/* Radial glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="w-40 h-40 rounded-full bg-accent-purple/30"
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="relative text-center space-y-3"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.3, repeat: 2 }}
            >
              <Zap
                size={48}
                className="mx-auto text-accent-cyan drop-shadow-[0_0_20px_rgba(0,255,255,0.5)]"
              />
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-bold uppercase tracking-widest text-accent-purple"
            >
              Level Up!
            </motion.p>

            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring", damping: 8 }}
              className="text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]"
            >
              {level}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
