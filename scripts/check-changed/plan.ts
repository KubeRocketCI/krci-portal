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
  build: Target[];
  tsc: Target[];
  lint: Target[];
  /**
   * `whole`: projects that run every test.
   * `graph`: projects that run only the tests whose import graph reaches a changed file (`vitest --changed`).
   */
  tests: { whole: Target[]; graph: Target[] };
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
  /**
   * Test projects a change runs in whole; without it, the change runs its own project's import graph.
   * Shared: trpc tests read shared from source; client and server read its `dist`, outside the import graph.
   */
  wholeTestProjects?: Target[];
}

const TARGETS: Record<Target, TargetSpec> = {
  shared: {
    dir: "packages/shared",
    built: true,
    feeds: ["trpc"],
    consumers: ["trpc", "server", "client"],
    wholeTestProjects: ["shared", "trpc"],
  },
  trpc: { dir: "packages/trpc", built: true, feeds: [], consumers: ["server", "client"] },
  server: { dir: "apps/server", built: false, feeds: [], consumers: [] },
  client: { dir: "apps/client", built: false, feeds: [], consumers: [] },
  scripts: { dir: "scripts", built: false, feeds: [], consumers: [] },
};

const ORDER: Target[] = ["shared", "trpc", "server", "client", "scripts"];

const ROOT_PRETTIER = "node_modules/.bin/prettier";

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

/** Target directory with a trailing `/`: a path prefix and a Vitest filter. */
export const projectPath = (target: Target) => `${TARGETS[target].dir}/`;

const targetOf = (path: string): Target | undefined => ORDER.find((target) => path.startsWith(projectPath(target)));

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
  const graphProjects = new Set<Target>();
  const unmapped: string[] = [];

  for (const { path } of changes) {
    if (WORKSPACE_FILES.has(path)) {
      ORDER.forEach((target) => {
        changed.add(target);
        wholeProjects.add(target);
      });
      continue;
    }
    const target = targetOf(path);
    if (!target) {
      unmapped.push(path);
      continue;
    }
    if (path.endsWith(".md")) continue;
    changed.add(target);
    const whole = TARGETS[target].wholeTestProjects;
    if (whole) whole.forEach((project) => wholeProjects.add(project));
    else graphProjects.add(target);
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

  return {
    format,
    build,
    tsc,
    lint: inOrder(changedTargets).filter((target) => env.hasLintScript(target)),
    tests: {
      whole: inOrder(wholeProjects),
      graph: inOrder(graphProjects).filter((target) => !wholeProjects.has(target)),
    },
    unmapped,
  };
}
