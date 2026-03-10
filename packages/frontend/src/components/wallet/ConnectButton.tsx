"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Wallet, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/components/wallet/WalletProvider";
import clsx from "clsx";

function truncateAccount(account: string): string {
  if (account.length <= 8) return account;
  return `${account.slice(0, 4)}...${account.slice(-4)}`;
}

export function ConnectButton() {
  const { account, isConnected, isLoading, login, logout } = useWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <button
        disabled
        className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed"
      >
        <Wallet size={16} />
        <span>Loading...</span>
      </button>
    );
  }

  if (!isConnected || !account) {
    return (
      <button
        onClick={login}
        className="flex items-center gap-2 bg-gradient-to-r from-accent-purple to-accent-cyan text-white font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
      >
        <Wallet size={16} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={clsx(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all",
          dropdownOpen
            ? "border-accent-purple bg-accent-purple/10 text-white"
            : "border-surface-border bg-surface hover:border-accent-purple/50 text-gray-300 hover:text-white",
        )}
      >
        {/* Tier indicator dot */}
        <span className="w-2 h-2 rounded-full bg-accent-purple" />
        <span className="text-sm font-medium">
          {truncateAccount(account)}
        </span>
      </button>

      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 rounded-xl bg-background-card border border-surface-border shadow-lg shadow-black/30 overflow-hidden z-50"
          >
            <Link
              href={`/profile/${account}`}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-surface transition-colors"
            >
              <User size={16} />
              <span>View Profile</span>
            </Link>
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-red-400 hover:bg-surface transition-colors border-t border-surface-border"
            >
              <LogOut size={16} />
              <span>Disconnect</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
