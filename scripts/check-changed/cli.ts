import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { findTestImporters, type TestSource } from "./importers.js";
import {
  formatGroups,
  planChecks,
  targetDir,
  targetOf,
  type ChangedFile,
  type FormatGroup,
  type PlanEnv,
  type Target,
} from "./plan.js";

// Prints shell lines for scripts/check-changed.sh to eval: `run_step LABEL CWD ARGV...`, `note TEXT`,
// and `begin_parallel` / `end_parallel` around the steps that run concurrently.
// Usage: cli.ts plan --root DIR --base REF
//        cli.ts staged-format --root DIR

interface Step {
  label: string;
  cwd: string;
  argv: string[];
}

const quote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

const git = (root: string, args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });

const nulSeparated = (output: string) => output.split("\0").filter(Boolean);

function changedFiles(root: string, base: string): ChangedFile[] {
  const files = new Map<string, ChangedFile>();
  const diff = nulSeparated(git(root, ["diff", "--name-status", "--no-renames", "-z", base]));
  for (let i = 0; i + 1 < diff.length; i += 2) {
    const [status, path] = [diff[i], diff[i + 1]];
    files.set(path, { path, status: status === "A" ? "added" : status === "D" ? "deleted" : "modified" });
  }
  for (const path of nulSeparated(git(root, ["ls-files", "--others", "--exclude-standard", "-z"]))) {
    files.set(path, { path, status: "added" });
  }
  return [...files.values()];
}

/** Inside a git hook, GIT_INDEX_FILE holds the index of the commit being made. */
const stagedFiles = (root: string): string[] =>
  nulSeparated(git(root, ["diff", "--cached", "--name-only", "--diff-filter=d", "-z"]));

/** Repo-relative files under `dir`, without node_modules and dist. */
function walk(root: string, dir: string): string[] {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === "dist") return [];
    const path = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(root, path) : [path];
  });
}

const TEST_FILE = /\.test\.tsx?$/;

/** client and server import `@/` from their own src (tsconfig paths). */
const ALIASED: Target[] = ["client", "server"];

function planEnv(root: string): PlanEnv {
  const scripts = (dir: string): Record<string, string> =>
    JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8")).scripts ?? {};
  const tests = new Map<Target, TestSource[]>();
  const testsOf = (target: Target) => {
    if (!tests.has(target)) {
      const paths = walk(root, `${targetDir(target)}/src`).filter((path) => TEST_FILE.test(path));
      tests.set(
        target,
        paths.map((path) => ({ path, source: readFileSync(join(root, path), "utf8") }))
      );
    }
    return tests.get(target) ?? [];
  };
  const mtime = (path: string) => statSync(join(root, path)).mtimeMs;

  return {
    hasLocalPrettier: (dir) => existsSync(join(root, dir, "node_modules/.bin/prettier")),
    hasLintScript: (target) =>
      target === "scripts" ? "lint:scripts" in scripts(".") : "lint" in scripts(targetDir(target)),
    isBuildStale: (target) => {
      const declarations = `${targetDir(target)}/dist/index.d.ts`;
      if (!existsSync(join(root, declarations))) return true;
      const builtAt = mtime(declarations);
      return walk(root, `${targetDir(target)}/src`).some((path) => !TEST_FILE.test(path) && mtime(path) > builtAt);
    },
    testImporters: (path) => {
      const target = targetOf(path);
      if (!target) return [];
      const aliases: Record<string, string> = ALIASED.includes(target) ? { "@/": `${targetDir(target)}/src/` } : {};
      return findTestImporters(path, testsOf(target), aliases);
    },
  };
}

/** Workspace packages are named after their target; `scripts` is not one and runs root `<script>:scripts`. */
const pnpmScript = (root: string, target: Target, script: "build" | "tsc" | "lint"): Step => ({
  label: `${script} ${target}`,
  cwd: root,
  argv: target === "scripts" ? ["pnpm", `${script}:scripts`] : ["pnpm", `--filter=${target}`, script],
});

const prettierWriteStep = (root: string, group: FormatGroup): Step => ({
  label: `format ${group.cwd}`,
  cwd: join(root, group.cwd),
  argv: [join(root, group.prettier), "--write", "--ignore-unknown", "--log-level", "warn", ...group.files],
});

/** Checks index contents, not the working tree; exit 1 unformatted, 2 Prettier or git failed. */
const indexCheckStep = (root: string, group: FormatGroup): Step => ({
  label: `format check ${group.cwd}`,
  cwd: join(root, group.cwd),
  argv: [
    "node",
    "--no-deprecation",
    "--import",
    "tsx",
    join(root, "scripts/check-changed/check-format.ts"),
    "--root",
    root,
    ...group.files.map((file) => `${group.cwd}/${file}`),
  ],
});

function printSteps(steps: Step[]) {
  for (const { label, cwd, argv } of steps) console.log(["run_step", label, cwd, ...argv].map(quote).join(" "));
}

const note = (text: string) => console.log(`note ${quote(text)}`);

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  const { values } = parseArgs({
    args: rest,
    options: { root: { type: "string" }, base: { type: "string" } },
  });
  const root = values.root;
  if (!root) throw new Error("--root is required");

  if (mode === "staged-format") {
    printSteps(formatGroups(stagedFiles(root), planEnv(root)).map((group) => indexCheckStep(root, group)));
    return;
  }
  if (mode !== "plan") throw new Error(`unknown mode: ${mode ?? "(none)"}; expected plan or staged-format`);
  if (!values.base) throw new Error("--base is required");

  const changes = changedFiles(root, values.base);
  const plan = planChecks(changes, planEnv(root));
  note(`${changes.length} changed files since ${values.base.slice(0, 12)}`);
  if (plan.unmapped.length > 0) note(`no checks for: ${plan.unmapped.join(", ")}`);

  const steps: Step[] = plan.format.map((group) => prettierWriteStep(root, group));
  if (plan.install) {
    steps.push({ label: "install (new file in shared)", cwd: root, argv: ["pnpm", "install", "--frozen-lockfile"] });
  }
  steps.push(...plan.build.map((target) => pnpmScript(root, target, "build")));
  printSteps(steps);

  const checks: Step[] = [
    ...plan.tsc.map((target) => pnpmScript(root, target, "tsc")),
    ...plan.lint.map((target) => pnpmScript(root, target, "lint")),
  ];
  if (plan.tests.paths.length > 0) {
    checks.push({
      label: `test ${plan.tests.projects.join(" ")}`,
      cwd: root,
      argv: [
        join(root, "node_modules/.bin/vitest"),
        "run",
        "--coverage.enabled=false",
        "--reporter=dot",
        "--passWithNoTests",
        ...plan.tests.projects.flatMap((project) => ["--project", project]),
        ...plan.tests.paths,
      ],
    });
  }
  if (checks.length > 0) {
    console.log("begin_parallel");
    printSteps(checks);
    console.log("end_parallel");
  }
}

main();
