"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { useWallet } from "@/components/wallet/WalletProvider";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/quests", label: "Quests" },
  { href: "/skill-trees", label: "Skill Trees" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
  { href: "/create", label: "Create" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-surface-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
            XPR Quests
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-sm font-medium transition-colors hover:text-accent-purple",
                pathname === link.href
                  ? "text-accent-purple"
                  : "text-gray-400",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop connect button + notifications */}
        <div className="hidden md:flex items-center gap-2">
          {isConnected && <NotificationBell />}
          <ConnectButton />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-background/95 backdrop-blur animate-slide-up">
          <div className="flex flex-col gap-2 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "text-sm font-medium py-2 px-3 rounded-lg transition-colors",
                  pathname === link.href
                    ? "text-accent-purple bg-accent-purple/10"
                    : "text-gray-400 hover:text-white hover:bg-surface",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-surface-border">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
