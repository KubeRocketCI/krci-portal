import { describe, expect, it } from "vitest";
import { planChecks, type ChangedFile, type PlanEnv } from "./plan.js";

const env: PlanEnv = {
  hasLocalPrettier: (dir) => dir === "apps/client",
  hasLintScript: () => true,
  isBuildStale: () => false,
};

const modified = (...paths: string[]): ChangedFile[] => paths.map((path) => ({ path, status: "modified" }));

describe("planChecks", () => {
  it("checks a client module change in the client package and its import graph", () => {
    const plan = planChecks(modified("apps/client/src/modules/home/pages/overview/view.tsx"), env);

    expect(plan).toEqual({
      format: [
        {
          cwd: "apps/client",
          prettier: "apps/client/node_modules/.bin/prettier",
          files: ["src/modules/home/pages/overview/view.tsx"],
        },
      ],
      build: [],
      tsc: ["client"],
      lint: ["client"],
      tests: { whole: [], graph: ["client"] },
      unmapped: [],
    });
  });

  it("builds shared and trpc and type-checks every consumer when shared changes", () => {
    const plan = planChecks(modified("packages/shared/src/models/k8s/groups/KRCI/Codebase/labels.ts"), env);

    expect(plan.build).toEqual(["shared", "trpc"]);
    expect(plan.tsc).toEqual(["shared", "trpc", "server", "client"]);
    expect(plan.lint).toEqual(["shared"]);
    expect(plan.tests).toEqual({ whole: ["shared", "trpc"], graph: [] });
  });

  it("runs the whole trpc project, not its import graph, when shared and trpc change together", () => {
    const plan = planChecks(
      modified("packages/shared/src/index.ts", "packages/trpc/src/clients/k8s/index.ts", "apps/server/src/index.ts"),
      env
    );

    expect(plan.tests).toEqual({ whole: ["shared", "trpc"], graph: ["server"] });
  });

  it("runs the import graph of a trpc change", () => {
    const plan = planChecks(
      modified(
        "packages/trpc/src/routers/prometheus/procedures/getDeploymentMetrics/index.ts",
        "packages/trpc/src/clients/k8s/index.ts"
      ),
      env
    );

    expect(plan.build).toEqual(["trpc"]);
    expect(plan.tsc).toEqual(["trpc", "server", "client"]);
    expect(plan.tests).toEqual({ whole: [], graph: ["trpc"] });
  });

  it("runs the import graph, not the whole client, for a client change outside src/modules", () => {
    const plan = planChecks(
      modified(
        "apps/client/src/modules/platform/codebases/utils.ts",
        "apps/client/src/core/hooks/usePinnedItems.ts",
        "apps/server/src/index.ts"
      ),
      env
    );

    expect(plan.tests).toEqual({ whole: [], graph: ["server", "client"] });
  });

  it("type-checks a deleted file's package without formatting the file", () => {
    const plan = planChecks([{ path: "apps/server/src/legacy.ts", status: "deleted" }], env);

    expect(plan.format).toEqual([]);
    expect(plan.tsc).toEqual(["server"]);
  });

  it("checks every target when a workspace-wide config file changes", () => {
    const plan = planChecks(modified("pnpm-lock.yaml"), env);

    expect(plan.format).toEqual([]);
    expect(plan.build).toEqual(["shared", "trpc"]);
    expect(plan.tsc).toEqual(["shared", "trpc", "server", "client", "scripts"]);
    expect(plan.tests).toEqual({ whole: ["shared", "trpc", "server", "client", "scripts"], graph: [] });
    expect(plan.unmapped).toEqual([]);
  });

  it("only formats a Markdown file inside a package", () => {
    const plan = planChecks(modified("apps/client/README.md"), env);

    expect(plan.format).toEqual([
      { cwd: "apps/client", prettier: "apps/client/node_modules/.bin/prettier", files: ["README.md"] },
    ]);
    expect(plan.tsc).toEqual([]);
    expect(plan.lint).toEqual([]);
    expect(plan.tests).toEqual({ whole: [], graph: [] });
  });

  it("lists files outside every target as unmapped", () => {
    const plan = planChecks(modified("docs/adr/0002-agent-substrate.md", "CLAUDE.md"), env);

    expect(plan.unmapped).toEqual(["docs/adr/0002-agent-substrate.md", "CLAUDE.md"]);
    expect(plan.format).toEqual([]);
    expect(plan.tsc).toEqual([]);
  });

  it("formats scripts with the root Prettier binary and lints only targets with a lint script", () => {
    const plan = planChecks(modified("scripts/check-changed/plan.ts", "apps/server/src/index.ts"), {
      ...env,
      hasLintScript: (target) => target === "scripts",
    });

    expect(plan.format).toEqual([
      { cwd: "scripts", prettier: "node_modules/.bin/prettier", files: ["check-changed/plan.ts"] },
      { cwd: "apps/server", prettier: "node_modules/.bin/prettier", files: ["src/index.ts"] },
    ]);
    expect(plan.lint).toEqual(["scripts"]);
  });

  it("builds a stale or missing dependency before type-checking its consumers", () => {
    const plan = planChecks(modified("apps/client/src/modules/home/pages/overview/view.tsx"), {
      ...env,
      isBuildStale: (target) => target === "trpc",
    });

    expect(plan.build).toEqual(["trpc"]);
    expect(plan.tsc).toEqual(["client"]);
  });

  it("skips a stale build when nothing that reads it is type-checked", () => {
    const plan = planChecks(modified("scripts/check-changed/plan.ts"), { ...env, isBuildStale: () => true });

    expect(plan.build).toEqual([]);
  });

  it("rebuilds what a stale shared build feeds", () => {
    const plan = planChecks(modified("apps/server/src/index.ts"), {
      ...env,
      isBuildStale: (target) => target === "shared",
    });

    expect(plan.build).toEqual(["shared", "trpc"]);
  });
});
