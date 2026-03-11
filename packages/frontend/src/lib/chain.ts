"use client";

import { SessionKit } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { WalletPluginWebAuth } from "@proton/wharfkit-plugin-webauth";
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor";

export const XPR_MAINNET_CHAIN_ID =
  "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0";
export const XPR_TESTNET_CHAIN_ID =
  "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd";

const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === "mainnet";

const ACTIVE_CHAIN_ID = IS_MAINNET
  ? XPR_MAINNET_CHAIN_ID
  : XPR_TESTNET_CHAIN_ID;

const ACTIVE_RPC = IS_MAINNET
  ? (process.env.NEXT_PUBLIC_XPR_RPC ?? "https://proton.eosusa.io")
  : "https://protontestnet.ledgerwise.io";

const WEBAUTH_SCHEME = (IS_MAINNET ? "proton" : "proton-dev") as
  | "proton-dev"
  | "proton";

let _sessionKit: SessionKit | null = null;

export function getSessionKit(): SessionKit {
  if (!_sessionKit) {
    _sessionKit = new SessionKit({
      appName: "XPR Quests",
      chains: [
        {
          id: ACTIVE_CHAIN_ID,
          url: ACTIVE_RPC,
        },
      ],
      ui: new WebRenderer(),
      walletPlugins: [
        new WalletPluginWebAuth({ scheme: WEBAUTH_SCHEME }),
        new WalletPluginAnchor(),
      ],
    });
  }
  return _sessionKit;
}
