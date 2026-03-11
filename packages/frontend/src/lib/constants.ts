export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/ws";
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "testnet";

const IS_MAINNET = NETWORK === "mainnet";

export const XPR_RPC = IS_MAINNET
  ? (process.env.NEXT_PUBLIC_XPR_RPC ?? "https://proton.eosusa.io")
  : "https://protontestnet.ledgerwise.io";

export const CHAIN_ID = IS_MAINNET
  ? "384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0"
  : "71ee83bcf52142d61019d95f9cc5427ba6a0d7ff8accd9e2088ae2abeaf3d3dd";
