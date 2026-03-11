#!/usr/bin/env bash
set -euo pipefail

# Create Atomic Assets collection and schema for quest badges on testnet
# Prerequisites:
#   - cleos configured for testnet
#   - xprquests account exists and has keys in wallet

ENDPOINT="${XPR_RPC_ENDPOINT:-https://protontestnet.ledgerwise.io}"
COLLECTION="xprquestbdg"
SCHEMA="questbadges"
AUTHOR="xprquests"

echo "=== Setting up Atomic Assets for quest badges ==="

echo "--- Creating collection: $COLLECTION ---"
cleos -u "$ENDPOINT" push action atomicassets createcol \
  "{\"author\":\"$AUTHOR\",\"collection_name\":\"$COLLECTION\",\"allow_notify\":true,\"authorized_accounts\":[\"$AUTHOR\"],\"notify_accounts\":[],\"market_fee\":0.0,\"data\":[]}" \
  -p "$AUTHOR@active"

echo "--- Creating schema: $SCHEMA ---"
cleos -u "$ENDPOINT" push action atomicassets createschema \
  "{\"authorized_creator\":\"$AUTHOR\",\"collection_name\":\"$COLLECTION\",\"schema_name\":\"$SCHEMA\",\"schema_format\":[{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"img\",\"type\":\"image\"},{\"name\":\"description\",\"type\":\"string\"},{\"name\":\"quest_id\",\"type\":\"uint64\"},{\"name\":\"skill_tree\",\"type\":\"string\"},{\"name\":\"xp_reward\",\"type\":\"uint32\"},{\"name\":\"difficulty\",\"type\":\"string\"}]}" \
  -p "$AUTHOR@active"

echo ""
echo "=== Atomic Assets setup complete ==="
echo "Collection: $COLLECTION"
echo "Schema: $SCHEMA"
echo "Author: $AUTHOR"
echo ""
echo "To create badge templates, use the admin API: POST /api/admin/badges/template"
