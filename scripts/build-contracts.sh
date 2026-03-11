#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Building xprquests ==="
cd "$ROOT_DIR/contracts/xprquests"
npx proton-tsc assembly/xprquests.contract.ts

echo "=== Building xprquestxp ==="
cd "$ROOT_DIR/contracts/xprquestxp"
npx proton-tsc assembly/xprquestxp.contract.ts

echo "=== Building xprseasons ==="
cd "$ROOT_DIR/contracts/xprseasons"
npx proton-tsc assembly/xprseasons.contract.ts

echo "=== All contracts built successfully ==="
