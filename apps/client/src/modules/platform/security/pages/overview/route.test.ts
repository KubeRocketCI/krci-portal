import { describe, expect, it, vi } from "vitest";
import { securityOverviewSearchSchema } from "./route";

// The parent route pulls in the tRPC client; the search is validated without it.
vi.mock("@/core/router/routes", () => ({ routeSecurity: {} }));

describe("the search params of the Security overview", () => {
  it("read the filters the lists share, so an old link with a namespace opens filtered to it", () => {
    expect(securityOverviewSearchSchema.parse({ namespace: "demo-dev" })).toMatchObject({ namespace: "demo-dev" });
    expect(securityOverviewSearchSchema.parse({ cluster: "in-cluster", codebase: "demo-app" })).toMatchObject({
      cluster: ["in-cluster"],
      codebase: "demo-app",
    });
  });

  it("read an Environment by its CDPipeline and Stage, a number as the name", () => {
    expect(securityOverviewSearchSchema.parse({ cdPipeline: "demo", stage: 2024 })).toMatchObject({
      cdPipeline: "demo",
      stage: "2024",
    });
  });

  it("drop a value they cannot use and keep the others", () => {
    expect(
      securityOverviewSearchSchema.parse({
        level: "kernel",
        cluster: "a,b",
        namespace: "Not A Name",
        cdPipeline: "demo",
        stage: "Not A Stage",
        codebase: "demo-app",
        severity: "Fatal",
        state: "mitigated",
        tab: "pipelines",
        rowsPerPage: 25,
      })
    ).toEqual({
      level: undefined,
      cluster: undefined,
      namespace: undefined,
      cdPipeline: "demo",
      stage: undefined,
      codebase: "demo-app",
      severity: undefined,
      state: "mitigated",
      tab: undefined,
    });
  });
});
