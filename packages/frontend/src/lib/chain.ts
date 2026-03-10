"use client";

import { SessionKit } from "@wharfkit/session";
import { WebRenderer } from "@wharfkit/web-renderer";
import { WalletPluginWebAuth } from "@proton/wharfkit-plugin-webauth";
import { CHAIN_ID, XPR_RPC } from "./constants";

let _sessionKit: SessionKit | null = null;

export function getSessionKit(): SessionKit {
  if (!_sessionKit) {
    _sessionKit = new SessionKit({
      appName: "XPR Quests",
      chains: [
        {
          id: CHAIN_ID,
          url: XPR_RPC,
        },
      ],
      ui: new WebRenderer(),
      walletPlugins: [new WalletPluginWebAuth()],
    });
  }
  return _sessionKit;
}
