import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fakeCrd = {
  metadata: { name: "pipelineruns.tekton.dev" },
  spec: {
    group: "tekton.dev",
    versions: [{ name: "v1", storage: true, served: true }],
    names: { plural: "pipelineruns", kind: "PipelineRun" },
    scope: "Namespaced",
  },
};

vi.mock("./useCRDCatalog", () => ({
  useCRDCatalog: vi.fn(() => ({
    data: { array: [fakeCrd] },
    isLoading: false,
    error: null,
  })),
}));

import { useCRDByGVR } from "./useCRDByGVR";

describe("useCRDByGVR", () => {
  it("resolves the matching CRD", () => {
    const { result } = renderHook(() => useCRDByGVR("tekton.dev", "v1", "pipelineruns"));
    expect(result.current.crd).toEqual(fakeCrd);
  });

  it("returns undefined when no CRD matches the GVR", () => {
    const { result } = renderHook(() => useCRDByGVR("missing.io", "v1", "things"));
    expect(result.current.crd).toBeUndefined();
  });

  it("does NOT match a version that is served: false (deprecated)", async () => {
    const { useCRDCatalog } = await import("./useCRDCatalog");
    const deprecatedCrd = {
      ...fakeCrd,
      spec: {
        ...fakeCrd.spec,
        versions: [{ name: "v1beta1", storage: false, served: false }],
      },
    };
    (useCRDCatalog as unknown as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      data: { array: [deprecatedCrd] },
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useCRDByGVR("tekton.dev", "v1beta1", "pipelineruns"));
    expect(result.current.crd).toBeUndefined();
  });
});
