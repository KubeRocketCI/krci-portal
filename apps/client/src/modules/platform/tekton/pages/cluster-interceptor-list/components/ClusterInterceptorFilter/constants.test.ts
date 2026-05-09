import { describe, expect, test } from "vitest";
import { clusterInterceptorSchema } from "@my-project/shared";
import { matchFunctions, CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES } from "./constants";

const searchMatch = matchFunctions[CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES.SEARCH]!;

const make = (name: string) =>
  clusterInterceptorSchema.parse({
    apiVersion: "triggers.tekton.dev/v1alpha1",
    kind: "ClusterInterceptor",
    metadata: { name, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
  });

describe("ClusterInterceptor matchFunctions.search", () => {
  test("empty search passes everything", () => {
    expect(searchMatch(make("github"), "")).toBe(true);
  });
  test("name substring match", () => {
    expect(searchMatch(make("github-build"), "build")).toBe(true);
  });
  test("non-matching name dropped", () => {
    expect(searchMatch(make("github-build"), "gitlab")).toBe(false);
  });
});

// Cluster-scoped invariant: ClusterInterceptor lives outside any namespace, so
// the filter MUST NOT expose a namespace match (regression-guard against
// copy-paste from the namespaced sibling filters).
describe("ClusterInterceptor matchFunctions — cluster-scoped invariant", () => {
  test("matchFunctions does not expose a namespace key", () => {
    expect(matchFunctions).not.toHaveProperty("namespace");
    expect(matchFunctions).not.toHaveProperty("namespaces");
  });
  test("CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES does not declare a namespace filter", () => {
    expect(Object.values(CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES)).not.toContain("namespace");
    expect(Object.values(CLUSTER_INTERCEPTOR_LIST_FILTER_NAMES)).not.toContain("namespaces");
  });
});
