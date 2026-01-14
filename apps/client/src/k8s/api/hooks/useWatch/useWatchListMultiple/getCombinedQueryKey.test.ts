import { describe, test, expect } from "vitest";
import { sortByName } from "@/core/utils/sortByName";

/**
 * Helper to create a stable query key for the combined query
 * Note: This is a copy of the internal function for testing purposes
 */
const getCombinedQueryKey = (
  clusterName: string,
  resourcePluralName: string,
  namespaces: string[],
  labels?: Record<string, string>
) => {
  return [
    "k8s-watch-list-multiple",
    clusterName,
    resourcePluralName,
    [...namespaces].sort(sortByName).join(","),
    labels ? JSON.stringify(labels) : undefined,
  ].filter(Boolean);
};

describe("getCombinedQueryKey", () => {
  test("should generate consistent keys regardless of namespace order", () => {
    const key1 = getCombinedQueryKey("cluster1", "pods", ["ns-a", "ns-b", "ns-c"]);
    const key2 = getCombinedQueryKey("cluster1", "pods", ["ns-c", "ns-b", "ns-a"]);
    const key3 = getCombinedQueryKey("cluster1", "pods", ["ns-b", "ns-c", "ns-a"]);

    expect(key1).toEqual(key2);
    expect(key2).toEqual(key3);
    expect(key1[3]).toBe("ns-a,ns-b,ns-c");
  });

  test("should handle namespaces with special characters", () => {
    const key1 = getCombinedQueryKey("cluster1", "pods", ["default", "kube-system", "kube-public"]);
    const key2 = getCombinedQueryKey("cluster1", "pods", ["kube-public", "default", "kube-system"]);

    expect(key1).toEqual(key2);
    expect(key1[3]).toBe("default,kube-public,kube-system");
  });

  test("should handle namespaces with accents and unicode", () => {
    const key1 = getCombinedQueryKey("cluster1", "pods", ["café", "bar", "ñoño"]);
    const key2 = getCombinedQueryKey("cluster1", "pods", ["bar", "ñoño", "café"]);

    expect(key1).toEqual(key2);
    // localeCompare should handle accented characters properly
    expect(key1[3]).toBe("bar,café,ñoño");
  });

  test("should include labels in key when provided", () => {
    const labels = { app: "myapp", env: "prod" };
    const key = getCombinedQueryKey("cluster1", "pods", ["default"], labels);

    expect(key).toContain(JSON.stringify(labels));
  });

  test("should not include labels in key when not provided", () => {
    const key = getCombinedQueryKey("cluster1", "pods", ["default"]);

    expect(key).toHaveLength(4); // without labels
    expect(key).not.toContain("undefined");
  });

  test("should generate different keys for different clusters", () => {
    const key1 = getCombinedQueryKey("cluster1", "pods", ["default"]);
    const key2 = getCombinedQueryKey("cluster2", "pods", ["default"]);

    expect(key1).not.toEqual(key2);
  });

  test("should generate different keys for different resources", () => {
    const key1 = getCombinedQueryKey("cluster1", "pods", ["default"]);
    const key2 = getCombinedQueryKey("cluster1", "deployments", ["default"]);

    expect(key1).not.toEqual(key2);
  });

  test("should handle single namespace", () => {
    const key = getCombinedQueryKey("cluster1", "pods", ["default"]);

    expect(key[3]).toBe("default");
  });

  test("should handle empty namespace array", () => {
    const key = getCombinedQueryKey("cluster1", "pods", []);

    // Empty string is filtered out by .filter(Boolean)
    expect(key).toHaveLength(3);
    expect(key[0]).toBe("k8s-watch-list-multiple");
    expect(key[1]).toBe("cluster1");
    expect(key[2]).toBe("pods");
  });

  test("should not mutate the original namespaces array", () => {
    const originalNamespaces = ["ns-c", "ns-a", "ns-b"];
    const namespacesBeforeCall = [...originalNamespaces];

    getCombinedQueryKey("cluster1", "pods", originalNamespaces);

    // Verify the original array order is preserved
    expect(originalNamespaces).toEqual(namespacesBeforeCall);
    expect(originalNamespaces[0]).toBe("ns-c");
    expect(originalNamespaces[1]).toBe("ns-a");
    expect(originalNamespaces[2]).toBe("ns-b");
  });
});
