import { describe, expect, it, vi } from "vitest";
import { vulnerabilitiesSearchSchema } from "./route";

// The parent route pulls in the tRPC client; the search is validated without it.
vi.mock("@/core/router/routes", () => ({ routeSecurity: {} }));

describe("the search params of the vulnerability list", () => {
  it("read one cluster or a repeated cluster as a list, as a link from a Stage page names it", () => {
    expect(vulnerabilitiesSearchSchema.parse({ cluster: "in-cluster", namespace: "demo-dev" })).toMatchObject({
      cluster: ["in-cluster"],
      namespace: "demo-dev",
    });
    expect(vulnerabilitiesSearchSchema.parse({ cluster: ["in-cluster", "edge"] }).cluster).toEqual([
      "in-cluster",
      "edge",
    ]);
  });

  it("drop a cluster that no tag can hold, as the server would refuse it: a space or a comma", () => {
    expect(vulnerabilitiesSearchSchema.parse({ cluster: "a,b" }).cluster).toBeUndefined();
    expect(vulnerabilitiesSearchSchema.parse({ cluster: ["in-cluster", "a b"] }).cluster).toBeUndefined();
  });

  it("read a number where a name is expected as the name", () => {
    expect(vulnerabilitiesSearchSchema.parse({ namespace: 123 }).namespace).toBe("123");
  });

  it("drop a value they cannot use and keep the others", () => {
    expect(
      vulnerabilitiesSearchSchema.parse({
        level: "kernel",
        cluster: [],
        namespace: "Not A Name",
        severity: "Fatal",
        state: "deleted",
        page: 0,
        rowsPerPage: 7,
        vulnerabilityId: " CVE-2026-0001 ",
      })
    ).toEqual({
      level: undefined,
      cluster: undefined,
      namespace: undefined,
      codebase: undefined,
      severity: undefined,
      state: undefined,
      vulnerabilityId: "CVE-2026-0001",
      component: undefined,
      page: undefined,
      rowsPerPage: undefined,
    });
  });
});
