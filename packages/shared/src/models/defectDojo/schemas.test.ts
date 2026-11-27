import { describe, expect, it } from "vitest";
import { PLATFORM_LIST_DEFAULT_PAGE_SIZE } from "./constants.js";
import {
  environmentSummaryInputSchema,
  exposedSecretsInputSchema,
  findingsScopeSchema,
  securityOverviewCodebasesInputSchema,
  securityOverviewInputSchema,
} from "./schemas.js";

describe("environmentSummaryInputSchema", () => {
  it("takes the Stage as the route of the Stage page names it", () => {
    const input = { namespace: "krci", cdPipeline: "demo", stage: "dev" };

    expect(environmentSummaryInputSchema.parse(input)).toEqual(input);
  });

  it("refuses a tag or a DefectDojo id sent along, and a value that is no Kubernetes name", () => {
    const stage = { namespace: "krci", cdPipeline: "demo", stage: "dev" };

    expect(environmentSummaryInputSchema.safeParse({ ...stage, tags: ["k8s-cluster:in-cluster"] }).success).toBe(false);
    expect(environmentSummaryInputSchema.safeParse({ ...stage, productIds: [4] }).success).toBe(false);
    expect(environmentSummaryInputSchema.safeParse({ ...stage, stage: "dev/../prod" }).success).toBe(false);
  });
});

describe("securityOverviewInputSchema", () => {
  it("takes the installation namespace and counts the active findings by default", () => {
    expect(securityOverviewInputSchema.parse({ namespace: "krci" })).toEqual({ namespace: "krci", state: "active" });
  });

  it("refuses Mitigated, which Runtime has not, and a tag or a DefectDojo id sent along", () => {
    expect(securityOverviewInputSchema.safeParse({ namespace: "krci", state: "mitigated" }).success).toBe(false);
    expect(securityOverviewInputSchema.safeParse({ namespace: "krci", tags: ["k8s-cluster:in-cluster"] }).success).toBe(
      false
    );
    expect(securityOverviewInputSchema.safeParse({ namespace: "krci", productIds: [7] }).success).toBe(false);
  });
});

describe("securityOverviewCodebasesInputSchema", () => {
  it("takes every state, Mitigated too: a fixed finding of a CI scan is mitigated", () => {
    expect(securityOverviewCodebasesInputSchema.parse({ namespace: "krci", state: "mitigated" })).toEqual({
      namespace: "krci",
      state: "mitigated",
    });
  });

  it("refuses a namespace that is no Kubernetes name", () => {
    expect(securityOverviewCodebasesInputSchema.safeParse({ namespace: "krci/../x" }).success).toBe(false);
  });
});

describe("exposedSecretsInputSchema", () => {
  it("takes a code list of one codebase and fills the defaults: active findings, the first page", () => {
    expect(exposedSecretsInputSchema.parse({ level: "code", namespace: "krci", codebase: "demo-app" })).toEqual({
      level: "code",
      namespace: "krci",
      codebase: "demo-app",
      state: "active",
      page: 0,
      pageSize: PLATFORM_LIST_DEFAULT_PAGE_SIZE,
    });
  });

  it("takes a Mitigated code list: a fixed secret of the code is mitigated", () => {
    expect(exposedSecretsInputSchema.parse({ level: "code", namespace: "krci", state: "mitigated" }).state).toBe(
      "mitigated"
    );
  });

  it("takes a runtime list of some clusters and one namespace, and refuses Mitigated, which Runtime has not", () => {
    expect(
      exposedSecretsInputSchema.parse({
        level: "runtime",
        namespace: "krci",
        clusters: ["in-cluster"],
        workloadNamespace: "demo-dev",
        severity: "High",
      })
    ).toMatchObject({ level: "runtime", clusters: ["in-cluster"], workloadNamespace: "demo-dev", state: "active" });
    expect(
      exposedSecretsInputSchema.safeParse({ level: "runtime", namespace: "krci", state: "mitigated" }).success
    ).toBe(false);
  });

  it.each([
    ["a vulnerability id, which a secret finding has not", { vulnerabilityId: "CVE-2026-0001" }],
    ["a component, which a secret finding has not", { component: "openssl" }],
    ["a tag from the browser", { tags: ["app.edp.epam.com/tenant:other"] }],
    ["a DefectDojo test id from the browser", { test: 42 }],
  ])("refuses %s", (_, extra) => {
    expect(exposedSecretsInputSchema.safeParse({ level: "code", namespace: "krci", ...extra }).success).toBe(false);
  });

  it("refuses the Image level: the page lists secrets of the code and of running workloads", () => {
    expect(exposedSecretsInputSchema.safeParse({ level: "image", namespace: "krci" }).success).toBe(false);
  });
});

describe("findingsScopeSchema", () => {
  it("carries the default clusters of a list next to the Stage clusters and every cluster", () => {
    const scope = {
      state: "data",
      defaultClusters: ["in-cluster"],
      stageClusters: ["in-cluster"],
      clusters: ["in-cluster", "edge"],
      namespaces: [],
    };

    expect(findingsScopeSchema.parse(scope)).toEqual(scope);
    expect(findingsScopeSchema.safeParse({ ...scope, defaultClusters: undefined }).success).toBe(false);
  });
});
