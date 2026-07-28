#!/usr/bin/env bash
# PostToolUse(Write|Edit): format the file Claude just wrote.
# No `set -e`: the edit is already applied, so formatting must never fail it.
set -uo pipefail

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')

# Absolute path required: `dirname .` is a fixpoint, so a relative path spins the loop below.
[ -n "$file" ] || exit 0
case "$file" in
  /*) ;;
  *) exit 0 ;;
esac

# Narrower than Prettier's own support (it also handles .md/.yaml) — inherited from the previous hook.
case "$file" in
  *.ts | *.tsx | *.js | *.json | *.css | *.html) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

# Prettier resolves plugins relative to cwd, not the config file: apps/client's tailwind plugin is only visible there.
dir=$(dirname "$file")
while [ "$dir" != "/" ]; do
  if [ -f "$dir/prettier.config.js" ] || [ -f "$dir/.prettierrc" ] || [ -f "$dir/.prettierrc.json" ]; then
    break
  fi
  dir=$(dirname "$dir")
done

# No config above the file: npx from / would fetch an unpinned Prettier.
if [ "$dir" = "/" ]; then
  exit 0
fi

cd "$dir" || exit 0

# --stdin-filepath, not a path argument: Prettier globs its arguments, so routes/[id].tsx would format a different file.
# npx, not node_modules/.bin/prettier: only apps/client has a local binary.
tmp=$(mktemp) || exit 0
if npx prettier --stdin-filepath "$file" --log-level warn <"$file" >"$tmp" && [ -s "$tmp" ]; then
  cat "$tmp" >"$file" # cat, not mv: preserves inode and permissions
else
  echo "prettier-on-write: failed to format $file, left unchanged" >&2
fi
rm -f "$tmp"

exit 0
