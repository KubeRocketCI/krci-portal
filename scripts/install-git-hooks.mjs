// Root prepare script: points git at .githooks.
// Leaves an existing core.hooksPath or a custom .git/hooks script in place and says so.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return undefined;
  }
};

const gitDir = tryGit("rev-parse", "--git-common-dir");
if (gitDir === undefined) process.exit(0);

const hooksPath = tryGit("config", "core.hooksPath");
if (hooksPath === ".githooks") process.exit(0);
if (hooksPath) {
  console.warn(`install-git-hooks: core.hooksPath is ${hooksPath}; .githooks/pre-commit not active.`);
  process.exit(0);
}

const localHooks = join(gitDir, "hooks");
const custom = existsSync(localHooks) ? readdirSync(localHooks).filter((name) => !name.endsWith(".sample")) : [];
if (custom.length > 0) {
  console.warn(`install-git-hooks: ${localHooks} has ${custom.join(", ")}; .githooks/pre-commit not active.`);
  process.exit(0);
}

if (tryGit("config", "core.hooksPath", ".githooks") === undefined) {
  console.warn("install-git-hooks: could not write git config; run: git config core.hooksPath .githooks");
}
