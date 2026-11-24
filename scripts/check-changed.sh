#!/usr/bin/env bash
# Checkpoint before a commit: format, build, tsc, lint and test what changed since the base.
# Usage: check-changed.sh [--base REF]   default base: merge-base with origin/main
#        check-changed.sh --staged   prettier --check on the staged contents (.githooks/pre-commit)
# Exit: 0 pass; 3 staged contents not formatted; any other code: a failed step, a check that could not run, a usage error.
# Bash 3.2 compatible (macOS /bin/bash).
set -euo pipefail

# Git hooks may pass a relative GIT_INDEX_FILE; the cd below changes what it is relative to.
if [ -n "${GIT_INDEX_FILE:-}" ]; then
  case "$GIT_INDEX_FILE" in
    /*) ;;
    *) GIT_INDEX_FILE="$PWD/$GIT_INDEX_FILE"; export GIT_INDEX_FILE ;;
  esac
fi

root=$(git rev-parse --show-toplevel)
[ -x "$root/node_modules/.bin/tsx" ] || { echo "check-changed: tsx missing; run pnpm install --frozen-lockfile" >&2; exit 1; }

cd "$root"
# node --import tsx: the tsx CLI needs an IPC socket; the agent sandbox has none.
# --no-deprecation: tsx calls module.register(), deprecated in Node 26.
exec node --no-deprecation --import tsx scripts/check-changed/cli.ts "$@"
