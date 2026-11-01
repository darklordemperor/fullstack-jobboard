#!/bin/sh

set -eu

lock_hash="$(sha256sum package-lock.json | awk '{print $1}')"
marker_path="node_modules/.dashboard-api-package-lock.sha256"
installed_hash=""

if [ -f "$marker_path" ]; then
  installed_hash="$(cat "$marker_path")"
fi

if [ "$installed_hash" != "$lock_hash" ]; then
  echo "package-lock.json changed; refreshing container dependencies..."
  npm ci
  printf '%s\n' "$lock_hash" > "$marker_path"
fi

exec npm run dev -- --hostname 0.0.0.0
