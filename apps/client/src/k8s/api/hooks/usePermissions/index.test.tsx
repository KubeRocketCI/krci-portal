import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePermissions } from "./index";
import { useTRPCClient } from "@/core/providers/trpc";
import { createTestQueryClient } from "@/test/utils";
import { defaultPermissions } from "@my-project/shared";

// Mock dependencies
const mockTrpcClient = {
  k8s: {
    itemPermissions: {
      mutate: vi.fn(),
    },
  },
};

vi.mock("@/core/providers/trpc", () => ({
  useTRPCClient: vi.fn(),
}));

const { mockClusterStoreState, mockSetState } = vi.hoisted(() => {
  const mockClusterStoreState = {
    clusterName: "test-cluster",
    defaultNamespace: "default",
  };
  const mockSetState = vi.fn();
  return { mockClusterStoreState, mockSetState };
});

vi.mock("@/k8s/store", () => ({
  useClusterStore: Object.assign(
    vi.fn((selector) => {
      if (selector) {
        return selector(mockClusterStoreState);
      }
      return mockClusterStoreState;
    }),
    {
      setState: mockSetState,
      getState: vi.fn(() => mockClusterStoreState),
    }
  ),
}));

describe("usePermissions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.mocked(useTRPCClient).mockReturnValue(mockTrpcClient as never);
    mockClusterStoreState.clusterName = "test-cluster";
    mockClusterStoreState.defaultNamespace = "default";
  });

  it("should call itemPermissions.mutate with the resolved GVR + cluster + namespace", async () => {
    const mockPermissions = {
      create: { allowed: true, reason: "" },
      patch: { allowed: true, reason: "" },
      delete: { allowed: false, reason: "Not allowed" },
    };
    vi.mocked(mockTrpcClient.k8s.itemPermissions.mutate).mockResolvedValue(mockPermissions);

    const { result } = renderHook(
      () =>
        usePermissions({
          group: "test.group",
          version: "v1",
          resourcePlural: "resources",
        }),
      {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      }
    );

    // Wait for query to complete
    await waitFor(
      () => {
        expect(result.current.data).toEqual(mockPermissions);
      },
      { timeout: 5000 }
    );

    expect(mockTrpcClient.k8s.itemPermissions.mutate).toHaveBeenCalledWith({
      clusterName: "test-cluster",
      group: "test.group",
      version: "v1",
      namespace: "default",
      resourcePlural: "resources",
    });
  });

  it("should use cluster name and namespace from store", async () => {
    mockClusterStoreState.clusterName = "custom-cluster";
    mockClusterStoreState.defaultNamespace = "custom-namespace";

    const mockPermissions = {
      create: { allowed: true, reason: "" },
    };
    vi.mocked(mockTrpcClient.k8s.itemPermissions.mutate).mockResolvedValue(mockPermissions);

    renderHook(
      () =>
        usePermissions({
          group: "test.group",
          version: "v1",
          resourcePlural: "resources",
        }),
      {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      }
    );

    await waitFor(() => {
      expect(mockTrpcClient.k8s.itemPermissions.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          clusterName: "custom-cluster",
          namespace: "custom-namespace",
        })
      );
    });
  });

  it("should return placeholder data initially", () => {
    const { result } = renderHook(
      () =>
        usePermissions({
          group: "test.group",
          version: "v1",
          resourcePlural: "resources",
        }),
      {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      }
    );

    // Should have placeholder data while loading
    expect(result.current.data).toEqual(defaultPermissions);
  });

  it("should skip the network call when enabled is false", () => {
    renderHook(
      () =>
        usePermissions({
          group: "test.group",
          version: "v1",
          resourcePlural: "resources",
          enabled: false,
        }),
      {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      }
    );

    expect(mockTrpcClient.k8s.itemPermissions.mutate).not.toHaveBeenCalled();
  });
});
