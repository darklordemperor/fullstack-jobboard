#!/usr/bin/env bash
set -euo pipefail

repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$repo_root"

cleanup() {
  docker compose rm -sf backend-e2e frontend-e2e >/dev/null 2>&1 || true
}

trap cleanup EXIT
cleanup
docker compose --profile e2e run --rm --build playwright-e2e
