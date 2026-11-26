import { describe, expect, it, vi } from "vitest";
import { toViewFilters, withFilters } from "./search";

// The parent route pulls in the tRPC client.
vi.mock("@/core/router/routes", () => ({ routeSecurity: {} }));

describe("withFilters", () => {
  it("clears the namespace and the Environment when the clusters change: their options depend on the clusters", () => {
    const search = {
      namespace: "demo-dev",
      cdPipeline: "demo",
      stage: "dev",
      severity: "High" as const,
      tab: "codebases" as const,
    };

    expect(withFilters(search, { cluster: ["edge"] })).toEqual({
      cluster: ["edge"],
      namespace: undefined,
      cdPipeline: undefined,
      stage: undefined,
      severity: "High",
      tab: "codebases",
    });
    expect(withFilters(search, { severity: undefined })).toEqual({ ...search, severity: undefined });
  });
});

describe("toViewFilters", () => {
  it("are the clusters of the search, or the default clusters, and an Environment only with its CDPipeline and Stage", () => {
    expect(toViewFilters({ cdPipeline: "demo" }, ["in-cluster"])).toEqual({
      clusters: ["in-cluster"],
      namespace: undefined,
      environment: undefined,
      codebase: undefined,
      level: undefined,
      severity: undefined,
    });
    expect(
      toViewFilters({ cluster: ["edge"], cdPipeline: "demo", stage: "dev", level: "image" }, ["in-cluster"])
    ).toMatchObject({ clusters: ["edge"], environment: { cdPipeline: "demo", stage: "dev" }, level: "image" });
  });
});
