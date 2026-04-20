import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { createTestQueryClient } from "@/test/utils";
import { useTRPCClient } from "@/core/providers/trpc";
import { useApplyYaml } from "./index";

const mockApplyYaml = vi.fn();

const mockTrpcClient = {
  k8s: {
    applyYaml: { mutate: mockApplyYaml },
  },
};

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: vi.fn(),
}));

const { mockClusterStoreState } = vi.hoisted(() => {
  const mockClusterStoreState = {
    clusterName: "test-cluster",
    defaultNamespace: "default",
  };
  return { mockClusterStoreState };
});

vi.mock("@/k8s/store", () => ({
  useClusterStore: Object.assign(
    vi.fn((selector) => (selector ? selector(mockClusterStoreState) : mockClusterStoreState)),
    {
      setState: vi.fn(),
      getState: vi.fn(() => mockClusterStoreState),
    }
  ),
}));

describe("useApplyYaml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTRPCClient).mockReturnValue(mockTrpcClient as never);
    mockClusterStoreState.clusterName = "test-cluster";
    mockClusterStoreState.defaultNamespace = "default";
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

  it("calls applyYaml with clusterName and resources", async () => {
    mockApplyYaml.mockResolvedValue([{ success: true, kind: "ConfigMap", name: "my-config" }]);

    const { result } = renderHook(() => useApplyYaml(), { wrapper });

    const resources = [{ apiVersion: "v1", kind: "ConfigMap", metadata: { name: "my-config", namespace: "prod" } }];

    await act(async () => {
      await result.current.mutateAsync(resources);
    });

    expect(mockApplyYaml).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      resources,
    });
  });

  it("injects defaultNamespace when metadata.namespace is missing", async () => {
    mockApplyYaml.mockResolvedValue([{ success: true }]);

    const { result } = renderHook(() => useApplyYaml(), { wrapper });

    const resources = [{ apiVersion: "v1", kind: "ConfigMap", metadata: { name: "my-config" } }];

    await act(async () => {
      await result.current.mutateAsync(resources);
    });

    expect(mockApplyYaml).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      resources: [{ apiVersion: "v1", kind: "ConfigMap", metadata: { name: "my-config", namespace: "default" } }],
    });
  });

  it("does not override an existing namespace in metadata", async () => {
    mockApplyYaml.mockResolvedValue([{ success: true }]);
    mockClusterStoreState.defaultNamespace = "default";

    const { result } = renderHook(() => useApplyYaml(), { wrapper });

    const resources = [{ apiVersion: "v1", kind: "ConfigMap", metadata: { name: "cfg", namespace: "production" } }];

    await act(async () => {
      await result.current.mutateAsync(resources);
    });

    expect(mockApplyYaml).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: [expect.objectContaining({ metadata: { name: "cfg", namespace: "production" } })],
      })
    );
  });

  it("uses clusterName from the cluster store", async () => {
    mockApplyYaml.mockResolvedValue([]);
    mockClusterStoreState.clusterName = "remote-cluster";

    const { result } = renderHook(() => useApplyYaml(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync([]);
    });

    expect(mockApplyYaml).toHaveBeenCalledWith(expect.objectContaining({ clusterName: "remote-cluster" }));
  });
});
