import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CRDObject } from "@my-project/shared";

vi.mock("@/k8s/api/hooks/useWatch/useWatchItem", () => ({
  useWatchItem: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isReady: true,
    resourceVersion: undefined,
    query: { isPending: false, isSuccess: true, error: null, isError: false } as never,
  })),
}));

import { useCR } from "./useCR";

const namespacedCrd: CRDObject = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  metadata: { name: "pipelineruns.tekton.dev", uid: "u", creationTimestamp: "" },
  spec: {
    group: "tekton.dev",
    scope: "Namespaced",
    names: { kind: "PipelineRun", plural: "pipelineruns", singular: "pipelinerun" },
    versions: [
      { name: "v1beta1", served: true, storage: false },
      { name: "v1", served: true, storage: true },
    ],
  },
};

describe("useCR", () => {
  it("forwards resourceConfig built from the CRD with storage version when no preferredVersion is given", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    renderHook(() => useCR(namespacedCrd, "ns", "pr-1"));
    const args = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(args.resourceConfig).toMatchObject({
      group: "tekton.dev",
      version: "v1",
      pluralName: "pipelineruns",
      kind: "PipelineRun",
    });
    expect(args.namespace).toBe("ns");
    expect(args.name).toBe("pr-1");
  });

  it("uses preferredVersion when supplied and present in the CRD", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    renderHook(() => useCR(namespacedCrd, "ns", "pr-1", "v1beta1"));
    expect((useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0].resourceConfig.version).toBe(
      "v1beta1"
    );
  });

  it("returns a stable resourceConfig reference when crd and preferredVersion are unchanged", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    (useWatchItem as unknown as ReturnType<typeof vi.fn>).mockClear();
    const { rerender } = renderHook(({ ns }: { ns: string }) => useCR(namespacedCrd, ns, "pr-1"), {
      initialProps: { ns: "ns" },
    });
    const firstConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].resourceConfig;
    rerender({ ns: "ns" });
    const secondConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0].resourceConfig;
    expect(secondConfig).toBe(firstConfig);
  });

  it("memo is stable when a fresh CRD object has the same resourceVersion (watch-tick churn guard)", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    (useWatchItem as unknown as ReturnType<typeof vi.fn>).mockClear();
    const crd1: CRDObject = {
      ...namespacedCrd,
      metadata: { ...namespacedCrd.metadata, resourceVersion: "100" },
    };
    const crd2: CRDObject = {
      ...namespacedCrd,
      metadata: { ...namespacedCrd.metadata, resourceVersion: "100" },
    };
    expect(crd1).not.toBe(crd2);
    const { rerender } = renderHook(({ c }: { c: CRDObject }) => useCR(c, "ns", "pr-1"), {
      initialProps: { c: crd1 },
    });
    const firstConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].resourceConfig;
    rerender({ c: crd2 });
    const secondConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0].resourceConfig;
    expect(secondConfig).toBe(firstConfig);
  });

  it("memo rebuilds when resourceVersion changes", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    (useWatchItem as unknown as ReturnType<typeof vi.fn>).mockClear();
    const crdV1: CRDObject = {
      ...namespacedCrd,
      metadata: { ...namespacedCrd.metadata, resourceVersion: "100" },
    };
    const crdV2: CRDObject = {
      ...namespacedCrd,
      metadata: { ...namespacedCrd.metadata, resourceVersion: "101" },
    };
    const { rerender } = renderHook(({ c }: { c: CRDObject }) => useCR(c, "ns", "pr-1"), {
      initialProps: { c: crdV1 },
    });
    const firstConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].resourceConfig;
    rerender({ c: crdV2 });
    const secondConfig = (useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0].resourceConfig;
    expect(secondConfig).not.toBe(firstConfig);
  });
});
