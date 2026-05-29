import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { k8sCustomResourceDefinitionConfig } from "@my-project/shared";

vi.mock("@/k8s/api/hooks/useWatch/useWatchItem", () => ({
  useWatchItem: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isReady: true,
    resourceVersion: undefined,
    query: { isPending: false, isSuccess: true, error: null, isError: false } as never,
  })),
}));

import { useCRD } from "./useCRD";

describe("useCRD", () => {
  it("calls useWatchItem with the CRD resource config and the provided name", async () => {
    const { useWatchItem } = await import("@/k8s/api/hooks/useWatch/useWatchItem");
    renderHook(() => useCRD("argoprojects.argoproj.io"));
    expect((useWatchItem as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatchObject({
      resourceConfig: k8sCustomResourceDefinitionConfig,
      name: "argoprojects.argoproj.io",
    });
  });
});
