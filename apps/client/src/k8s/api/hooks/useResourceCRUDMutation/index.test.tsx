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
      update: {
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

  describe("Update Operation", () => {
    it("should call update mutation with correct parameters", async () => {
      const patchedResource = { ...mockResource };
      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(patchedResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-patch", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(mockTrpcClient.k8s.update.mutate).toHaveBeenCalledWith({
        clusterName: "test-cluster",
        namespace: "default",
        name: "test-resource",
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });
    });

    it("should show update-specific messages", async () => {
      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockResource);
      vi.mocked(showToast).mockReturnValue("toast-id");

      const { result } = renderHook(() => useResourceCRUDMutation("test-patch", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      result.current.mutate({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith("Updating Resource test-resource", "loading");
      });

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith(
          "Resource test-resource has been successfully updated",
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

  describe("Cache update on success", () => {
    const itemQueryKey = ["k8s:watchItem", "test-cluster", "default", "resources", "test-resource"];
    const listQueryKeyNoLabels = ["k8s:watchList", "test-cluster", "default", "resources"];
    const listQueryKeyWithLabels = ["k8s:watchList", "test-cluster", "default", "resources", "tier,frontend"];

    const mockFreshResource = {
      apiVersion: "test.group/v1",
      kind: "Resource",
      metadata: {
        name: "test-resource",
        namespace: "default",
        uid: "uid-1",
        resourceVersion: "200",
      },
      spec: { applications: ["a", "b"] },
    };

    it("should write item cache after a successful update", async () => {
      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-update-cache", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(queryClient.getQueryData(itemQueryKey)).toEqual(mockFreshResource);
    });

    it("should patch list caches that already contain the item on update", async () => {
      const stalePrev = {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "100" },
        items: new Map([
          [
            "test-resource",
            { ...mockFreshResource, metadata: { ...mockFreshResource.metadata, resourceVersion: "100" } },
          ],
        ]),
      };
      queryClient.setQueryData(listQueryKeyNoLabels, stalePrev);
      queryClient.setQueryData(listQueryKeyWithLabels, {
        ...stalePrev,
        items: new Map(stalePrev.items),
      });

      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-update-list", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      const updatedPlain = queryClient.getQueryData<typeof stalePrev>(listQueryKeyNoLabels);
      expect(updatedPlain?.items.get("test-resource")?.metadata.resourceVersion).toBe("200");
      expect(updatedPlain?.metadata.resourceVersion).toBe("200");

      const updatedLabeled = queryClient.getQueryData<typeof stalePrev>(listQueryKeyWithLabels);
      expect(updatedLabeled?.items.get("test-resource")?.metadata.resourceVersion).toBe("200");
    });

    it("should not add the item to lists that don't contain it on update", async () => {
      const otherList = {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "50" },
        items: new Map(),
      };
      queryClient.setQueryData(listQueryKeyWithLabels, otherList);

      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-update-no-add", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      const after = queryClient.getQueryData<typeof otherList>(listQueryKeyWithLabels);
      expect(after?.items.has("test-resource")).toBe(false);
    });

    it("should write item cache but not lists on create", async () => {
      const otherList = {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "50" },
        items: new Map(),
      };
      queryClient.setQueryData(listQueryKeyNoLabels, otherList);

      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-create-cache", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(queryClient.getQueryData(itemQueryKey)).toEqual(mockFreshResource);
      const list = queryClient.getQueryData<typeof otherList>(listQueryKeyNoLabels);
      expect(list?.items.has("test-resource")).toBe(false);
    });

    it("should invalidate every list cache for the resource type on create", async () => {
      // Label selectors aren't known at mutation time, so on create we mark every
      // list (labeled and unlabeled) for the resource type as stale and force a
      // refetch — ensuring the new item appears when consumers (re)mount, even
      // when the watch was unsubscribed during navigation.
      const seedList = {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "50" },
        items: new Map(),
      };
      queryClient.setQueryData(listQueryKeyNoLabels, seedList);
      queryClient.setQueryData(listQueryKeyWithLabels, { ...seedList, items: new Map() });

      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-create-invalidate", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(queryClient.getQueryState(listQueryKeyNoLabels)?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(listQueryKeyWithLabels)?.isInvalidated).toBe(true);
    });

    it("should use server-assigned name from response for cache key on create (generateName)", async () => {
      // Resources created with generateName have no name on the draft; the API
      // server assigns one and returns it in the response. The cache key must
      // use the server-assigned name, not the draft's empty value.
      const draftWithoutName = {
        ...mockResource,
        metadata: { ...mockResource.metadata, name: undefined as unknown as string },
      };
      const generated = {
        ...mockFreshResource,
        metadata: { ...mockFreshResource.metadata, name: "generated-xyz" },
      };
      const generatedItemKey = ["k8s:watchItem", "test-cluster", "default", "resources", "generated-xyz"];

      vi.mocked(mockTrpcClient.k8s.create.mutate).mockResolvedValue(generated);

      const { result } = renderHook(() => useResourceCRUDMutation("test-create-generate-name", k8sOperation.create), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: draftWithoutName,
        resourceConfig: mockResourceConfig,
      });

      expect(queryClient.getQueryData(generatedItemKey)).toEqual(generated);
    });

    it("should remove item cache and prune lists on delete", async () => {
      queryClient.setQueryData(itemQueryKey, mockFreshResource);
      queryClient.setQueryData(listQueryKeyNoLabels, {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "100" },
        items: new Map([["test-resource", mockFreshResource]]),
      });

      vi.mocked(mockTrpcClient.k8s.delete.mutate).mockResolvedValue(undefined);

      const { result } = renderHook(() => useResourceCRUDMutation("test-delete-cache", k8sOperation.delete), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      expect(queryClient.getQueryData(itemQueryKey)).toBeUndefined();
      const list = queryClient.getQueryData<{ items: Map<string, unknown> }>(listQueryKeyNoLabels);
      expect(list?.items.has("test-resource")).toBe(false);
    });

    it("should not downgrade item cache when WebSocket already advanced resourceVersion", async () => {
      const newer = {
        ...mockFreshResource,
        metadata: { ...mockFreshResource.metadata, resourceVersion: "300" },
      };
      queryClient.setQueryData(itemQueryKey, newer);

      // Server response is older than what's already in cache (race with watch event)
      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-no-downgrade", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      const after = queryClient.getQueryData<typeof newer>(itemQueryKey);
      expect(after?.metadata.resourceVersion).toBe("300");
    });

    it("should not downgrade list cache when stored item has a newer resourceVersion", async () => {
      const newerInList = {
        ...mockFreshResource,
        metadata: { ...mockFreshResource.metadata, resourceVersion: "300" },
      };
      queryClient.setQueryData(listQueryKeyNoLabels, {
        apiVersion: "test.group/v1",
        kind: "ResourceList",
        metadata: { resourceVersion: "300" },
        items: new Map([["test-resource", newerInList]]),
      });

      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-list-no-downgrade", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: mockResourceConfig,
      });

      const after = queryClient.getQueryData<{
        metadata: { resourceVersion?: string };
        items: Map<string, { metadata: { resourceVersion?: string } }>;
      }>(listQueryKeyNoLabels);
      expect(after?.items.get("test-resource")?.metadata.resourceVersion).toBe("300");
      expect(after?.metadata.resourceVersion).toBe("300");
    });

    it("should use cluster scope key when resource is cluster-scoped", async () => {
      const clusterScopedConfig: K8sResourceConfig = { ...mockResourceConfig, clusterScoped: true };
      const clusterScopedItemKey = ["k8s:watchItem", "test-cluster", "__cluster__", "resources", "test-resource"];

      vi.mocked(mockTrpcClient.k8s.update.mutate).mockResolvedValue(mockFreshResource);

      const { result } = renderHook(() => useResourceCRUDMutation("test-cluster-scoped", k8sOperation.update), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.mutateAsync({
        resource: mockResource,
        resourceConfig: clusterScopedConfig,
      });

      expect(queryClient.getQueryData(clusterScopedItemKey)).toEqual(mockFreshResource);
    });
  });
});
