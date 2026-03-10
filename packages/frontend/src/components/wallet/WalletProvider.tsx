"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@wharfkit/session";
import { getSessionKit } from "@/lib/chain";
import { apiFetch } from "@/lib/api";

interface WalletContextType {
  session: Session | null;
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  session: null,
  account: null,
  isConnected: false,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
});

async function acquireBackendToken(account: string): Promise<void> {
  try {
    const res = await apiFetch<{
      success: boolean;
      data: { token: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ account }),
    });
    if (res.data?.token) {
      localStorage.setItem("xpr_quests_token", res.data.token);
    }
  } catch (err) {
    console.error("Backend auth failed:", err);
    throw err;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore previous session on mount
  useEffect(() => {
    async function restore() {
      try {
        const kit = getSessionKit();
        const restored = await kit.restore();
        if (restored) {
          setSession(restored);
          // Re-acquire backend token if missing
          const existingToken = localStorage.getItem("xpr_quests_token");
          if (!existingToken) {
            const account = restored.actor.toString();
            await acquireBackendToken(account);
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    restore();
  }, []);

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const kit = getSessionKit();
      const response = await kit.login();
      setSession(response.session);

      // Exchange wallet session for backend JWT
      const account = response.session.actor.toString();
      try {
        await acquireBackendToken(account);
      } catch {
        setError(
          "Connected to wallet but backend authentication failed. Some features may be unavailable.",
        );
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to connect wallet",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const kit = getSessionKit();
      if (session) {
        await kit.logout(session);
      }
      setSession(null);
      setError(null);
      localStorage.removeItem("xpr_quests_token");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [session]);

  const account = session?.actor?.toString() ?? null;

  return (
    <WalletContext.Provider
      value={{
        session,
        account,
        isConnected: !!session,
        isLoading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
