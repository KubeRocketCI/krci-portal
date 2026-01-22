import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useResourceCRUDMutation } from "./index";
import { k8sOperation, type K8sResourceConfig, type KubeObjectDraft } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { showToast } from "@/core/components/Snackbar";
import { createTestQueryClient } from "@/test/utils";

// Mock dependencies - use vi.hoisted to avoid hoisting issues
const { mockTrpcClient } = vi.hoisted(() => {
  const mockTrpcClient = {
    k8s: {
      create: {
        mutate: vi.fn(),
      },
      patch: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
    },
  };
  return { mockTrpcClient };
});

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

vi.mock("@/core/components/Snackbar", () => ({
  showToast: vi.fn(),
}));

describe("useResourceCRUDMutation", () => {
  let queryClient: QueryClient;

  const mockResourceConfig: K8sResourceConfig = {
    apiVersion: "test.group/v1",
    kind: "Resource",
    group: "test.group",
    version: "v1",
    singularName: "resource",
    pluralName: "resources",
  };

  const mockResource: KubeObjectDraft = {
    apiVersion: "test.group/v1",
    kind: "Resource",
    metadata: {
      name: "test-resource",
      namespace: "default",
    },
  } as KubeObjectDraft;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.mocked(useTRPCClient).mockReturnValue(mockTrpcClient as never);
    mockClusterStoreState.clusterName = "test-cluster";
    mockClusterStoreState.defaultNamespace = "default";
  });

  describe("Create Operation", () => {
    it("should call create mutation with correct parameters", async () => {
      const createdResource = { ...mockResource, metadata: { ...mockResource.metadata, uid: "123" } };
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(createdResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-create", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(mockTrpcClient.k8s.create.mutate).toHaveBeenCalledWith({
        clusterName: "test-cluster",
        resource: mockResource,
        namespace: "default",
        resourceConfig: mockResourceConfig,
      });
    });

    it("should use resource namespace when provided", async () => {
      const resourceWithNamespace = {
        ...mockResource,
        metadata: { ...mockResource.metadata, namespace: "custom-namespace" },
      };
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(resourceWithNamespace);

      const { result } = renderHook(() => useResourceCRUDMutation("test-create", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: resourceWithNamespace,
        resourceConfig: mockResourceConfig,
      });

      expect(mockTrpcClient.k8s.create.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: "custom-namespace",
        })
      );
    });

    it("should show default loading message", async () => {
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(() => useResourceCRUDMutation("test-create", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      result.current.mutate({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Applying Resource test-resource", "loading");
      });
    });

    it("should show default success message", async () => {
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(() => useResourceCRUDMutation("test-create", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          "Resource test-resource has been successfully applied",
          "success",
          expect.objectContaining({
            id: "toast-id",
            duration: 5000,
          })
        );
      });
    });

    it("should show custom messages when provided", async () => {
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(
        () =>
          useResourceCRUDMutation("test-create", k8sOperation.create, {
            createCustomMessages: () => ({
              loading: { message: "Custom loading" },
              success: { message: "Custom success", options: { duration: 10000 } },
              error: { message: "Custom error" },
            }),
          }),
        {
          wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
        }
      );

      result.current.mutate({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Custom loading", "loading");
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          "Custom success",
          "success",
          expect.objectContaining({
            id: "toast-id",
            duration: 10000,
          })
        );
      });
    });

    it("should call onMutate callback", async () => {
      const onMutate = vi.fn();
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);

      const { result } = renderHook(
        () =>
          useResourceCRUDMutation("test-create", k8sOperation.create, {
            callbacks: { onMutate },
          }),
        {
          wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
        }
      );

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(onMutate).toHaveBeenCalledWith(mockResource);
    });

    it("should call onSuccess callback", async () => {
      const onSuccess = vi.fn();
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);

      const { result } = renderHook(
        () =>
          useResourceCRUDMutation("test-create", k8sOperation.create, {
            callbacks: { onSuccess },
          }),
        {
          wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
        }
      );

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResource);
    });

    it("should call onError callback and show error message", async () => {
      const error = new Error("Create failed");
      const onError = vi.fn();
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockRejectedValue(error);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(
        () =>
          useResourceCRUDMutation("test-create", k8sOperation.create, {
            callbacks: { onError },
          }),
        {
          wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
        }
      );

      try {
        await result.current.mutateAsync({
          resource: mockResource,
          resourceConfig: mockResourceConfig,
        });
      } catch {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(error, mockResource);
        expect(showToast).toHaveBeenCalledWith(
          "Failed to apply Resource test-resource",
          "error",
          expect.objectContaining({
            id: "toast-id",
            duration: 10000,
            description: "Create failed",
          })
        );
      });
    });

    it("should not show messages when showMessages is false", async () => {
      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockResource);

      const { result } = renderHook(
        () =>
          useResourceCRUDMutation("test-create", k8sOperation.create, {
            showMessages: false,
          }),
        {
          wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
        }
      );

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(showToast).not.toHaveBeenCalled();
    });
  });

  describe("Patch Operation", () => {
    it("should call patch mutation with correct parameters", async () => {
      const patchedResource = { ...mockResource };
      vi.mocked(mockTrpcClient.k8s.patch.mutate).mockResolvedValue(patchedResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-patch", k8sOperation.patch), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(mockTrpcClient.k8s.patch.mutate).toHaveBeenCalledWith({
        clusterName: "test-cluster",
        namespace: "default",
        name: "test-resource",
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });
    });

    it("should show patch-specific messages", async () => {
      vi.mocked(mockTrpcClient.k8s.patch.mutate).mockResolvedValue(mockResource);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(() => useResourceCRUDMutation("test-patch", k8sOperation.patch), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      result.current.mutate({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Patching Resource test-resource", "loading");
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          "Resource test-resource has been successfully patched",
          "success",
          expect.objectContaining({
            id: "toast-id",
          })
        );
      });
    });
  });

  describe("Delete Operation", () => {
    it("should call delete mutation with correct parameters", async () => {
      vi.mocked(mockTrpcClient.k8s.delete.mutate).mockResolvedValue(undefined);

      const { result } = renderHook(() => useResourceCRUDMutation("test-delete", k8sOperation.delete), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(mockTrpcClient.k8s.delete.mutate).toHaveBeenCalledWith({
        clusterName: "test-cluster",
        namespace: "default",
        name: "test-resource",
        resourceConfig: mockResourceConfig,
      });
    });

    it("should show delete-specific messages", async () => {
      vi.mocked(mockTrpcClient.k8s.delete.mutate).mockResolvedValue(undefined);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(() => useResourceCRUDMutation("test-delete", k8sOperation.delete), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      result.current.mutate({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Deleting Resource test-resource", "loading");
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          "Resource test-resource has been successfully deleted",
          "success",
          expect.objectContaining({
            id: "toast-id",
          })
        );
      });
    });
  });
});
