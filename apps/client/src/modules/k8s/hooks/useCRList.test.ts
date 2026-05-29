import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CRDObject } from "@my-project/shared";

vi.mock("@/k8s/api/hooks/useWatch/useWatchList", () => ({
  useWatchList: vi.fn(() => ({
    data: { array: [], map: new Map() },
    isLoading: false,
    isReady: true,
    isEmpty: true,
    resourceVersion: "1",
    error: null,
    query: { isPending: false, isSuccess: true, error: null, isError: false } as never,
  })),
}));

import { useCRList } from "./useCRList";

const clusterScopedCrd: CRDObject = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  metadata: { name: "clusterrules.example.io", uid: "u", creationTimestamp: "" },
  spec: {
    group: "example.io",
    scope: "Cluster",
    names: { kind: "ClusterRule", plural: "clusterrules" },
    versions: [{ name: "v1", served: true, storage: true }],
  },
};

describe("useCRList", () => {
  it("forwards the built resourceConfig and namespace to useWatchList", async () => {
    const { useWatchList } = await import("@/k8s/api/hooks/useWatch/useWatchList");
    renderHook(() => useCRList(clusterScopedCrd, undefined));
    const args = (useWatchList as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.resourceConfig).toMatchObject({
      group: "example.io",
      version: "v1",
      pluralName: "clusterrules",
      clusterScoped: true,
    });
    expect(args.namespace).toBeUndefined();
  });
});
