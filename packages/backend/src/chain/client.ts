import { APIClient } from "@wharfkit/antelope";
import { Session } from "@wharfkit/session";
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey";
import { env } from "../config.js";

// API client for read-only chain queries
export const apiClient = new APIClient({ url: env.XPR_RPC_ENDPOINT });

// Server-side session for signing transactions (recordprogress, etc.)
// Only created if SERVER_PRIVATE_KEY is set
let _session: Session | null = null;
export function getSession(): Session {
  if (!_session) {
    if (!env.SERVER_PRIVATE_KEY) {
      throw new Error("SERVER_PRIVATE_KEY is required for signing transactions");
    }
    _session = new Session({
      chain: {
        id: env.XPR_NETWORK === "mainnet"
          ? "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0"
          : "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd",
        url: env.XPR_RPC_ENDPOINT,
      },
      actor: env.CONTRACT_ACCOUNT,
      permission: "active",
      walletPlugin: new WalletPluginPrivateKey(env.SERVER_PRIVATE_KEY),
    });
  }
  return _session;
}

// Generic table row reader
export async function getTableRows<T = any>(
  code: string,
  table: string,
  scope: string,
  options?: {
    lower_bound?: string;
    upper_bound?: string;
    limit?: number;
    key_type?: string;
    index_position?: string;
  }
): Promise<T[]> {
  const params: Record<string, unknown> = {
    code,
    table,
    scope,
    limit: options?.limit ?? 100,
    json: true,
  };
  if (options?.lower_bound) params.lower_bound = options.lower_bound;
  if (options?.upper_bound) params.upper_bound = options.upper_bound;

  const response = await apiClient.v1.chain.get_table_rows(params as any);
  return response.rows as T[];
}
