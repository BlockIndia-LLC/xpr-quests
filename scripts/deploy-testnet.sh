#!/usr/bin/env bash
set -euo pipefail

# Deploy contracts to XPR Network testnet
# Prerequisites:
#   - cleos or proton-cli configured for testnet
#   - Testnet accounts created: xprquests, xprquestxp, xprseasons
#   - Private keys imported into local wallet (cleos wallet unlock)

ENDPOINT="${XPR_RPC_ENDPOINT:-https://protontestnet.ledgerwise.io}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploying to: $ENDPOINT ==="

echo "--- Deploying xprquests ---"
cleos -u "$ENDPOINT" set contract xprquests \
  "$ROOT_DIR/contracts/xprquests/" \
  xprquests.wasm xprquests.abi \
  -p xprquests@active

echo "--- Deploying xprquestxp ---"
cleos -u "$ENDPOINT" set contract xprquestxp \
  "$ROOT_DIR/contracts/xprquestxp/" \
  xprquestxp.wasm xprquestxp.abi \
  -p xprquestxp@active

echo "--- Deploying xprseasons ---"
cleos -u "$ENDPOINT" set contract xprseasons \
  "$ROOT_DIR/contracts/xprseasons/" \
  xprseasons.wasm xprseasons.abi \
  -p xprseasons@active

echo ""
echo "=== Setting eosio.code permissions ==="
echo "NOTE: Update the public keys below before running!"
echo ""

# xprquests needs eosio.code to send inline actions to xprquestxp + atomicassets
# cleos -u "$ENDPOINT" set account permission xprquests active \
#   '{"threshold":1,"keys":[{"key":"YOUR_XPRQUESTS_PUBLIC_KEY","weight":1}],"accounts":[{"permission":{"actor":"xprquests","permission":"eosio.code"},"weight":1}]}' \
#   -p xprquests@owner

# xprseasons needs eosio.code to send inline token transfers
# cleos -u "$ENDPOINT" set account permission xprseasons active \
#   '{"threshold":1,"keys":[{"key":"YOUR_XPRSEASONS_PUBLIC_KEY","weight":1}],"accounts":[{"permission":{"actor":"xprseasons","permission":"eosio.code"},"weight":1}]}' \
#   -p xprseasons@owner

echo ""
echo "=== Initializing contract configs ==="

ADMIN="${ADMIN_ACCOUNT:-prem}"

# Set admin on xprquests
cleos -u "$ENDPOINT" push action xprquests setadmin "[\"$ADMIN\"]" -p xprquests@active

# Set config on xprquestxp (admin + authorized quest contract)
cleos -u "$ENDPOINT" push action xprquestxp setconfig "[\"$ADMIN\", \"xprquests\"]" -p xprquestxp@active

# Set config on xprseasons (admin + xp contract)
cleos -u "$ENDPOINT" push action xprseasons setconfig "[\"$ADMIN\", \"xprquestxp\"]" -p xprseasons@active

echo ""
echo "=== Deployment complete ==="
echo "Admin: $ADMIN"
echo "Quest contract: xprquests"
echo "XP contract: xprquestxp"
echo "Seasons contract: xprseasons"
