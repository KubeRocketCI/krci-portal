export type Target = "shared" | "trpc" | "server" | "client" | "scripts";

export type ChangeStatus = "added" | "modified" | "deleted";

export interface ChangedFile {
  /** Repo-relative, forward slashes. */
  path: string;
  status: ChangeStatus;
}

export interface PlanEnv {
  /** `dir` is repo-relative. True when `<dir>/node_modules/.bin/prettier` exists. */
  hasLocalPrettier(dir: string): boolean;
  hasLintScript(target: Target): boolean;
  /** Built targets only: `dist` is missing or older than a `src` file. */
  isBuildStale(target: Target): boolean;
  /** Repo-relative test files that import `path` (repo-relative) directly. */
  testImporters(path: string): string[];
}

export interface FormatGroup {
  /** Repo-relative; Prettier resolves plugins from the working directory. */
  cwd: string;
  /** Repo-relative path of the binary. */
  prettier: string;
  /** Relative to `cwd`. */
  files: string[];
}

export interface CheckPlan {
  format: FormatGroup[];
  install: boolean;
  build: Target[];
  tsc: Target[];
  lint: Target[];
  /** Vitest filters: repo-relative directories ending in `/`, run within `projects`. */
  tests: { projects: Target[]; paths: string[] };
  unmapped: string[];
}

interface TargetSpec {
  dir: string;
  /** Consumers read its `dist`, so a change rebuilds it. */
  built: boolean;
  /** Built targets it feeds, in build order. */
  feeds: Target[];
  /** Type-checked along with it. */
  consumers: Target[];
  /** Test projects a change outside `testDir` runs; trpc tests read shared from source. */
  testProjects: Target[];
  /** Matches, from the start of the target-relative path, the test directory of a change. */
  testDir?: RegExp;
}

const TARGETS: Record<Target, TargetSpec> = {
  shared: {
    dir: "packages/shared",
    built: true,
    feeds: ["trpc"],
    consumers: ["trpc", "server", "client"],
    testProjects: ["shared", "trpc"],
  },
  trpc: {
    dir: "packages/trpc",
    built: true,
    feeds: [],
    consumers: ["server", "client"],
    testProjects: ["trpc"],
    testDir: /^src\/(routers|clients)\/[^/]+\//,
  },
  server: { dir: "apps/server", built: false, feeds: [], consumers: [], testProjects: ["server"] },
  client: {
    dir: "apps/client",
    built: false,
    feeds: [],
    consumers: [],
    testProjects: ["client"],
    testDir: /^src\/modules\/[^/]+\//,
  },
  scripts: { dir: "scripts", built: false, feeds: [], consumers: [], testProjects: ["scripts"] },
};

const ORDER: Target[] = ["shared", "trpc", "server", "client", "scripts"];

const ROOT_PRETTIER = "node_modules/.bin/prettier";

/** trpc reads shared from an injected copy that holds only files present at install time. */
const SHARED_SRC = "packages/shared/src/";

/** Root files that every target builds, type-checks or tests against. */
const WORKSPACE_FILES = new Set([
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".npmrc",
  "tsconfig.json",
  "vitest.config.ts",
]);

export const targetDir = (target: Target) => TARGETS[target].dir;

const projectPath = (target: Target) => `${TARGETS[target].dir}/`;

export const targetOf = (path: string): Target | undefined =>
  ORDER.find((target) => path.startsWith(projectPath(target)));

/** Narrower test directory of a changed file, or undefined for the whole of `testProjects`. */
const testDirOf = (target: Target, path: string): string | undefined => {
  const match = TARGETS[target].testDir?.exec(path.slice(projectPath(target).length));
  return match ? `${projectPath(target)}${match[0]}` : undefined;
};

/**
 * Files CI format-checks (`pnpm format:check`), grouped by the directory Prettier runs in.
 * `--ignore-unknown` drops the files Prettier has no parser for.
 */
export function formatGroups(paths: string[], env: Pick<PlanEnv, "hasLocalPrettier">): FormatGroup[] {
  const groups = new Map<string, FormatGroup>();
  for (const path of paths) {
    const target = targetOf(path);
    if (!target) continue;
    const cwd = TARGETS[target].dir;
    const group = groups.get(cwd) ?? {
      cwd,
      prettier: env.hasLocalPrettier(cwd) ? `${cwd}/node_modules/.bin/prettier` : ROOT_PRETTIER,
      files: [],
    };
    group.files.push(path.slice(cwd.length + 1));
    groups.set(cwd, group);
  }
  return [...groups.values()];
}

export function planChecks(changes: ChangedFile[], env: PlanEnv): CheckPlan {
  const changed = new Set<Target>();
  const wholeProjects = new Set<Target>();
  const testDirs = new Map<string, Target>();
  const unmapped: string[] = [];
  const narrowed: { path: string; target: Target }[] = [];

  const changeWhole = (target: Target) => {
    changed.add(target);
    TARGETS[target].testProjects.forEach((project) => wholeProjects.add(project));
  };

  for (const { path } of changes) {
    if (WORKSPACE_FILES.has(path)) {
      ORDER.forEach(changeWhole);
      continue;
    }
    const target = targetOf(path);
    if (!target) {
      unmapped.push(path);
      continue;
    }
    if (path.endsWith(".md")) continue;
    const testDir = testDirOf(target, path);
    if (!testDir) {
      changeWhole(target);
      continue;
    }
    changed.add(target);
    testDirs.set(testDir, target);
    narrowed.push({ path, target });
  }

  const format = formatGroups(
    changes.filter(({ status }) => status !== "deleted").map(({ path }) => path),
    env
  );

  const changedTargets = [...changed];
  const inOrder = (targets: Iterable<Target>) => {
    const set = new Set(targets);
    return ORDER.filter((target) => set.has(target));
  };

  const tsc = inOrder(changedTargets.flatMap((target) => [target, ...TARGETS[target].consumers]));
  const staleReadByTsc = ORDER.filter(
    (target) =>
      TARGETS[target].built &&
      TARGETS[target].consumers.some((consumer) => tsc.includes(consumer)) &&
      env.isBuildStale(target)
  );
  const build = inOrder(
    [...changedTargets.filter((target) => TARGETS[target].built), ...staleReadByTsc].flatMap((target) => [
      target,
      ...TARGETS[target].feeds,
    ])
  );

  const narrowDirs = [...testDirs].filter(([, target]) => !wholeProjects.has(target));
  const dirs = narrowDirs.map(([dir]) => dir);
  const importers = narrowed
    .filter(({ target }) => !wholeProjects.has(target))
    .flatMap(({ path }) => env.testImporters(path))
    .filter((test) => !dirs.some((dir) => test.startsWith(dir)));
  const projects = inOrder([...wholeProjects, ...narrowDirs.map(([, target]) => target)]);
  const paths = [...inOrder(wholeProjects).map(projectPath), ...[...new Set([...dirs, ...importers])].sort()];

  return {
    format,
    install: changes.some(({ path, status }) => status === "added" && path.startsWith(SHARED_SRC)),
    build,
    tsc,
    lint: inOrder(changedTargets).filter((target) => env.hasLintScript(target)),
    tests: { projects, paths },
    unmapped,
  };
}
