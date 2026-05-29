import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const useWatchListMock = vi.fn();
vi.mock("@/k8s/api/hooks/useWatch/useWatchList", () => ({
  useWatchList: (params: unknown) => useWatchListMock(params),
}));

import { useHpaForTarget } from "./useHpaForTarget";

const makeHpa = (ref: { kind: string; name: string; apiVersion: string }, name = "h") => ({
  metadata: { name, uid: name },
  spec: { scaleTargetRef: ref },
});

describe("useHpaForTarget", () => {
  it("returns the matching HPA when one targets the resource", () => {
    useWatchListMock.mockReturnValue({
      data: {
        map: new Map([
          ["1", makeHpa({ kind: "Deployment", name: "foo", apiVersion: "apps/v1" }, "hpa-foo")],
          ["2", makeHpa({ kind: "Deployment", name: "bar", apiVersion: "apps/v1" }, "hpa-bar")],
        ]),
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );

    expect(result.current.hpa?.metadata.name).toBe("hpa-foo");
    expect(result.current.isLoading).toBe(false);
  });

  it("returns null when no HPA matches", () => {
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", makeHpa({ kind: "Deployment", name: "other", apiVersion: "apps/v1" })]]) },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );

    expect(result.current.hpa).toBeNull();
  });

  it("returns null when the list is empty", () => {
    useWatchListMock.mockReturnValue({ data: { map: new Map() }, isLoading: false });
    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );
    expect(result.current.hpa).toBeNull();
  });

  it("matches when HPA's scaleTargetRef.apiVersion is undefined (tolerant fallback)", () => {
    const hpa = {
      metadata: { name: "hpa-foo", uid: "u" },
      spec: { scaleTargetRef: { kind: "Deployment", name: "foo" } },
    };
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", hpa]]) },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );
    expect(result.current.hpa?.metadata.name).toBe("hpa-foo");
  });

  it("matches when HPA's apiVersion differs by version within the same group (apps/v1beta1 vs apps/v1)", () => {
    const hpa = {
      metadata: { name: "hpa-foo", uid: "u" },
      spec: { scaleTargetRef: { kind: "Deployment", name: "foo", apiVersion: "apps/v1beta1" } },
    };
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", hpa]]) },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );
    expect(result.current.hpa?.metadata.name).toBe("hpa-foo");
  });

  it("does NOT match when groups differ (other/v1 vs apps/v1)", () => {
    const hpa = {
      metadata: { name: "hpa-foo", uid: "u" },
      spec: { scaleTargetRef: { kind: "Deployment", name: "foo", apiVersion: "other/v1" } },
    };
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", hpa]]) },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );
    expect(result.current.hpa).toBeNull();
  });

  it("matches when HPA's scaleTargetRef.apiVersion is undefined and workload uses apps/v1 (well-known)", () => {
    const hpa = {
      metadata: { name: "hpa-foo", uid: "u" },
      spec: { scaleTargetRef: { kind: "Deployment", name: "foo" } },
    };
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", hpa]]) },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHpaForTarget({ namespace: "ns", kind: "Deployment", name: "foo", apiVersion: "apps/v1" })
    );
    expect(result.current.hpa?.metadata.name).toBe("hpa-foo");
  });

  it("does NOT match when HPA's scaleTargetRef.apiVersion is undefined and workload uses a non-standard apiVersion", () => {
    // An HPA without an explicit apiVersion should NOT match a custom operator workload
    // (e.g. apiVersion 'custom.example.com/v1') — the omission likely means the HPA author
    // assumed a standard kind and a cross-group name collision should not silently link.
    const hpa = {
      metadata: { name: "hpa-custom", uid: "u" },
      spec: { scaleTargetRef: { kind: "MyWorkload", name: "foo" } },
    };
    useWatchListMock.mockReturnValue({
      data: { map: new Map([["1", hpa]]) },
      isLoading: false,
    });
    const { result } = renderHook(() =>
      useHpaForTarget({
        namespace: "ns",
        kind: "MyWorkload" as never,
        name: "foo",
        apiVersion: "custom.example.com/v1",
      })
    );
    expect(result.current.hpa).toBeNull();
  });
});
