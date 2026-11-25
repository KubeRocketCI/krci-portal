import { describe, expect, it, vi } from "vitest";
import { exposedSecretsSearchSchema } from "./route";

// The parent route pulls in the tRPC client; the search is validated without it.
vi.mock("@/core/router/routes", () => ({ routeSecurity: {} }));

describe("the search params of the exposed secret lists", () => {
  it("read the filters of both lists and a page for each", () => {
    expect(
      exposedSecretsSearchSchema.parse({
        cluster: "in-cluster",
        namespace: "demo-dev",
        codebase: "demo-app",
        severity: "High",
        state: "mitigated",
        codePage: 2,
        runtimePage: 3,
        rowsPerPage: 50,
      })
    ).toEqual({
      cluster: ["in-cluster"],
      namespace: "demo-dev",
      codebase: "demo-app",
      severity: "High",
      state: "mitigated",
      codePage: 2,
      runtimePage: 3,
      rowsPerPage: 50,
    });
  });

  it("drop what the lists cannot use: a level, a vulnerability id, a bad page", () => {
    expect(exposedSecretsSearchSchema.parse({ level: "image", vulnerabilityId: "CVE-2026-0001", codePage: 0 })).toEqual(
      {
        cluster: undefined,
        namespace: undefined,
        codebase: undefined,
        severity: undefined,
        state: undefined,
        codePage: undefined,
        runtimePage: undefined,
        rowsPerPage: undefined,
      }
    );
  });
});
