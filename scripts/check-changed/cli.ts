import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import {
  formatGroups,
  planChecks,
  projectPath,
  targetDir,
  type ChangedFile,
  type FormatGroup,
  type PlanEnv,
  type Target,
} from "./plan.js";
import { killRunningSteps, runPool, runStep, type Step, type StepResult } from "./run.js";

// Entry of scripts/check-changed.sh; usage and exit codes are documented there.

const EXIT_USAGE = 2;
const EXIT_UNFORMATTED = 3;

class UsageError extends Error {}

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

function defaultBase(root: string): string {
  try {
    return execFileSync("git", ["-C", root, "merge-base", "origin/main", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    throw new UsageError("no merge-base with origin/main; pass --base REF");
  }
}

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

function planEnv(root: string): PlanEnv {
  const scripts = (dir: string): Record<string, string> =>
    JSON.parse(readFileSync(join(root, dir, "package.json"), "utf8")).scripts ?? {};
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
    process.execPath,
    "--no-deprecation",
    "--import",
    "tsx",
    join(root, "scripts/check-changed/check-format.ts"),
    "--root",
    root,
    ...group.files.map((file) => `${group.cwd}/${file}`),
  ],
});

/** `--passWithNoTests`: an import graph can reach no test. */
const testStep = (root: string, label: string, projects: Target[], filters: string[]): Step => ({
  label,
  cwd: root,
  argv: [
    join(root, "node_modules/.bin/vitest"),
    "run",
    "--reporter=dot",
    "--passWithNoTests",
    ...projects.flatMap((project) => ["--project", project]),
    ...filters,
  ],
});

const note = (text: string) => console.log(`== ${text}`);

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

function report({ step, status, elapsedMs, output }: StepResult) {
  if (output) process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  console.log(`${status === 0 ? "PASS" : "FAIL"}  ${step.label.padEnd(24)} ${seconds(elapsedMs)}`);
}

const announce = (step: Step) => console.log(`>> ${step.argv.join(" ")}`);

function requireBin(root: string, bin: string) {
  if (!existsSync(join(root, "node_modules/.bin", bin))) {
    throw new Error(`${bin} missing; run pnpm install --frozen-lockfile`);
  }
}

/** Every group is checked; an unformatted file wins over a check that could not run. */
async function checkStaged(root: string): Promise<number> {
  const groups = formatGroups(stagedFiles(root), planEnv(root));
  if (groups.length === 0) {
    note("nothing to check");
    return 0;
  }
  requireBin(root, "prettier");
  const results = await runPool(
    groups.map((group) => async () => {
      const result = await runStep(indexCheckStep(root, group), true);
      report(result);
      return result;
    }),
    availableParallelism()
  );
  if (results.some(({ status }) => status === 1)) return EXIT_UNFORMATTED;
  return results.find(({ status }) => status !== 0)?.status ?? 0;
}

/** Format and build run in order and stop at the first failure; tsc, lint and test run concurrently. */
async function checkPlan(root: string, base: string): Promise<number> {
  const start = Date.now();
  const changes = changedFiles(root, base);
  const plan = planChecks(changes, planEnv(root));
  note(`${changes.length} changed files since ${base.slice(0, 12)}`);
  if (plan.unmapped.length > 0) note(`no checks for: ${plan.unmapped.join(", ")}`);

  const serial: Step[] = [
    ...plan.format.map((group) => prettierWriteStep(root, group)),
    ...plan.build.map((target) => pnpmScript(root, target, "build")),
  ];
  const checks: Step[] = [
    ...plan.tsc.map((target) => pnpmScript(root, target, "tsc")),
    ...plan.lint.map((target) => pnpmScript(root, target, "lint")),
  ];
  const { whole, graph } = plan.tests;
  if (whole.length + graph.length > 0) requireBin(root, "vitest");
  if (whole.length > 0) checks.push(testStep(root, `test ${whole.join(" ")}`, whole, whole.map(projectPath)));
  if (graph.length > 0) checks.push(testStep(root, `test graph ${graph.join(" ")}`, graph, ["--changed", base]));
  if (serial.length + checks.length === 0) {
    note("nothing to check");
    return 0;
  }
  if (plan.format.length > 0) requireBin(root, "prettier");

  for (const step of serial) {
    announce(step);
    const result = await runStep(step, false);
    report(result);
    if (result.status !== 0) return result.status;
  }

  checks.forEach(announce);
  const results = await runPool(
    checks.map((step) => async () => {
      const result = await runStep(step, true);
      report(result);
      return result;
    }),
    availableParallelism()
  );
  const failed = results.find(({ status }) => status !== 0);
  if (failed) return failed.status;

  console.log(`PASS  ${"all".padEnd(24)} ${seconds(Date.now() - start)}`);
  return 0;
}

async function main(): Promise<number> {
  let options: { base?: string; staged?: boolean };
  try {
    options = parseArgs({ options: { base: { type: "string" }, staged: { type: "boolean" } } }).values;
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }
  if (options.staged && options.base) throw new UsageError("--staged takes no --base");

  const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
  return options.staged ? checkStaged(root) : checkPlan(root, options.base ?? defaultBase(root));
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    killRunningSteps();
    process.exit(signal === "SIGINT" ? 130 : 143);
  });
}

main().then(
  (status) => process.exit(status),
  (error: unknown) => {
    console.error(`check-changed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(error instanceof UsageError ? EXIT_USAGE : 1);
  }
);
