#!/usr/bin/env bash
# Checkpoint before a commit: format, build, tsc, lint and test what changed since the base.
# Usage: check-changed.sh [--base REF]   default base: merge-base with origin/main
#        check-changed.sh --staged   prettier --check on the staged contents (.githooks/pre-commit)
# Exit: 0 pass; 3 staged contents not formatted; any other code: a failed step, a check that could not run, a usage error.
# Bash 3.2 compatible (macOS /bin/bash).
set -euo pipefail

# Git hooks may pass a relative GIT_INDEX_FILE; later git calls run from other directories.
if [ -n "${GIT_INDEX_FILE:-}" ]; then
  case "$GIT_INDEX_FILE" in
    /*) ;;
    *) GIT_INDEX_FILE="$PWD/$GIT_INDEX_FILE"; export GIT_INDEX_FILE ;;
  esac
fi

root=$(git rev-parse --show-toplevel)
base=""
mode=plan

while [ $# -gt 0 ]; do
  case "$1" in
    --base)
      [ $# -ge 2 ] || { echo "check-changed: --base needs a ref" >&2; exit 2; }
      base=$2
      shift 2
      ;;
    --staged) mode=staged-format; shift ;;
    *) echo "check-changed: unknown option $1" >&2; exit 2 ;;
  esac
done

for bin in tsx prettier vitest; do
  [ -x "$root/node_modules/.bin/$bin" ] || { echo "check-changed: $bin missing; run pnpm install --frozen-lockfile" >&2; exit 1; }
done

now_ms() { node -e 'process.stdout.write(String(Date.now()))'; }

seconds() { printf '%d.%d s' $(($1 / 1000)) $((($1 % 1000) / 100)); }

note() { printf '== %s\n' "$1"; }

failed=0
unformatted=0
parallel=""
steps_n=0
logdir=""

# Staged mode: a check-format.ts exit 1 is an unformatted file; any other non-zero exit is a check that could not run.
report() {
  local label=$1 status=$2 elapsed=$3
  if [ "$status" -eq 0 ]; then
    printf 'PASS  %-24s %s\n' "$label" "$(seconds "$elapsed")"
  elif [ "$mode" != plan ] && [ "$status" -eq 1 ]; then
    printf 'FAIL  %-24s %s\n' "$label" "$(seconds "$elapsed")"
    unformatted=1
  else
    printf 'FAIL  %-24s %s\n' "$label" "$(seconds "$elapsed")"
    failed=$status
  fi
}

# Stops at the first failure in plan mode; staged mode reports every unformatted file.
stop_on_failure() { [ "$failed" -eq 0 ] || [ "$mode" != plan ] || exit "$failed"; }

run_step() {
  local label=$1 cwd=$2 start status
  shift 2
  printf '>> %s\n' "$*"
  start=$(now_ms)
  if [ -n "$parallel" ]; then
    labels[$steps_n]=$label
    starts[$steps_n]=$start
    (
      status=0
      (cd "$cwd" && "$@") >"$logdir/$steps_n.log" 2>&1 || status=$?
      now_ms >"$logdir/$steps_n.end"
      exit "$status"
    ) &
    pids[$steps_n]=$!
    steps_n=$((steps_n + 1))
    return 0
  fi
  status=0
  (cd "$cwd" && "$@") || status=$?
  report "$label" "$status" $(($(now_ms) - start))
  stop_on_failure
}

# Steps between begin_parallel and end_parallel run concurrently; each one's output prints when all are done.
begin_parallel() {
  parallel=1
  steps_n=0
  logdir=$(mktemp -d "${TMPDIR:-/tmp}/check-changed.XXXXXX")
}

end_parallel() {
  local i=0 status
  while [ "$i" -lt "$steps_n" ]; do
    status=0
    wait "${pids[$i]}" || status=$?
    cat "$logdir/$i.log"
    report "${labels[$i]}" "$status" $(($(cat "$logdir/$i.end") - ${starts[$i]}))
    i=$((i + 1))
  done
  rm -rf "$logdir"
  parallel=""
  stop_on_failure
}

trap 'pids_left=$(jobs -p); [ -z "$pids_left" ] || kill $pids_left 2>/dev/null; [ -z "$logdir" ] || rm -rf "$logdir"' EXIT

if [ "$mode" = plan ] && [ -z "$base" ]; then
  base=$(git -C "$root" merge-base origin/main HEAD) || {
    echo "check-changed: no merge-base with origin/main; pass --base REF" >&2
    exit 2
  }
fi

total_start=$(now_ms)
cd "$root"
# node --import tsx: the tsx CLI needs an IPC socket; the agent sandbox has none.
# --no-deprecation: tsx calls module.register(), deprecated in Node 26.
if [ "$mode" = plan ]; then
  steps=$(node --no-deprecation --import tsx scripts/check-changed/cli.ts plan --root "$root" --base "$base")
else
  steps=$(node --no-deprecation --import tsx scripts/check-changed/cli.ts staged-format --root "$root")
fi

if [ -z "$steps" ]; then
  note "nothing to check"
  exit 0
fi

eval "$steps"
[ "$unformatted" -eq 0 ] || exit 3
[ "$failed" -eq 0 ] || exit "$failed"
[ "$mode" = plan ] && printf 'PASS  %-24s %s\n' "all" "$(seconds $(($(now_ms) - total_start)))"
exit 0
