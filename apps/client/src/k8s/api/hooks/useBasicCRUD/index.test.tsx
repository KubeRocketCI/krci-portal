import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBasicCRUD } from "./index";
import { k8sOperation, type K8sResourceConfig, type KubeObjectDraft } from "@my-project/shared";
import { createTestQueryClient } from "@/test/utils";
import { useResourceCRUDMutation } from "../useResourceCRUDMutation";

// Mock useResourceCRUDMutation
const mockCreateMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
};

const mockEditMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
};

const mockDeleteMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
};

vi.mock("../useResourceCRUDMutation", () => ({
  useResourceCRUDMutation: vi.fn(),
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

describe("useBasicCRUD", () => {
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

    // Setup default mocks - reset implementation for each test
    vi.mocked(useResourceCRUDMutation).mockImplementation((_mutationKey, operation) => {
      if (operation === k8sOperation.create) {
        return mockCreateMutation as never;
      }
      if (operation === k8sOperation.patch) {
        return mockEditMutation as never;
      }
      if (operation === k8sOperation.delete) {
        return mockDeleteMutation as never;
      }
      return mockCreateMutation as never;
    });
  });

  describe("Mutations", () => {
    it("should create create mutation with correct config", () => {
      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(useResourceCRUDMutation).toHaveBeenNthCalledWith(
        1,
        "createMutation",
        k8sOperation.create,
        expect.objectContaining({
          createCustomMessages: expect.any(Function),
        })
      );
    });

    it("should create edit mutation with correct config", () => {
      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(useResourceCRUDMutation).toHaveBeenNthCalledWith(
        2,
        "EditMutation",
        k8sOperation.patch,
        expect.objectContaining({
          createCustomMessages: expect.any(Function),
        })
      );
    });

    it("should create delete mutation with correct config", () => {
      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(useResourceCRUDMutation).toHaveBeenNthCalledWith(
        3,
        "deleteMutation",
        k8sOperation.delete,
        expect.objectContaining({
          createCustomMessages: expect.any(Function),
        })
      );
    });

    it("should return all mutations", () => {
      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(result.current.mutations).toEqual({
        createMutation: mockCreateMutation,
        editMutation: mockEditMutation,
        deleteMutation: mockDeleteMutation,
      });
    });
  });

  describe("triggerCreate", () => {
    it("should call create mutation with resource and config", async () => {
      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerCreate({
        data: { resource: mockResource },
      });

      expect(mockCreateMutation.mutate).toHaveBeenCalledWith(
        {
          resource: mockResource,
          resourceConfig: mockResourceConfig,
        },
        {
          onSuccess: undefined,
          onError: undefined,
          onSettled: undefined,
        }
      );
    });

    it("should call onSuccess callback when provided", async () => {
      const onSuccess = vi.fn();
      mockCreateMutation.mutate.mockImplementation((_input, callbacks) => {
        callbacks?.onSuccess?.();
      });

      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerCreate({
        data: { resource: mockResource },
        callbacks: { onSuccess },
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it("should call onError callback when provided", async () => {
      const onError = vi.fn();
      mockCreateMutation.mutate.mockImplementation((_input, callbacks) => {
        callbacks?.onError?.(new Error("Failed"));
      });

      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerCreate({
        data: { resource: mockResource },
        callbacks: { onError },
      });

      expect(onError).toHaveBeenCalled();
    });

    it("should call onSettled callback when provided", async () => {
      const onSettled = vi.fn();
      mockCreateMutation.mutate.mockImplementation((_input, callbacks) => {
        callbacks?.onSettled?.();
      });

      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerCreate({
        data: { resource: mockResource },
        callbacks: { onSettled },
      });

      expect(onSettled).toHaveBeenCalled();
    });
  });

  describe("triggerEdit", () => {
    it("should call edit mutation with resource and config", async () => {
      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerEdit({
        data: { resource: mockResource },
      });

      expect(mockEditMutation.mutate).toHaveBeenCalledWith(
        {
          resource: mockResource,
          resourceConfig: mockResourceConfig,
        },
        {
          onSuccess: undefined,
          onError: undefined,
          onSettled: undefined,
        }
      );
    });

    it("should call callbacks when provided", async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      mockEditMutation.mutate.mockImplementation((_input, callbacks) => {
        callbacks?.onSuccess?.();
        callbacks?.onError?.(new Error("Failed"));
        callbacks?.onSettled?.();
      });

      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerEdit({
        data: { resource: mockResource },
        callbacks: { onSuccess, onError, onSettled },
      });

      expect(onSuccess).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalled();
    });
  });

  describe("triggerDelete", () => {
    it("should call delete mutation with resource and config", async () => {
      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerDelete({
        data: { resource: mockResource },
      });

      expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(
        {
          resource: mockResource,
          resourceConfig: mockResourceConfig,
        },
        {
          onSuccess: undefined,
          onError: undefined,
          onSettled: undefined,
        }
      );
    });

    it("should call callbacks when provided", async () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      mockDeleteMutation.mutate.mockImplementation((_input, callbacks) => {
        callbacks?.onSuccess?.();
        callbacks?.onError?.(new Error("Failed"));
        callbacks?.onSettled?.();
      });

      const { result } = renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      await result.current.triggerDelete({
        data: { resource: mockResource },
        callbacks: { onSuccess, onError, onSettled },
      });

      expect(onSuccess).toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
      expect(onSettled).toHaveBeenCalled();
    });
  });

  describe("Custom Messages", () => {
    it("should create custom messages for create operation", () => {
      let createCustomMessages: ((item: KubeObjectDraft) => unknown) | undefined;

      vi.mocked(useResourceCRUDMutation).mockImplementation((_mutationKey, operation, options) => {
        if (operation === k8sOperation.create && options?.createCustomMessages) {
          createCustomMessages = options.createCustomMessages;
          return mockCreateMutation as never;
        }
        if (operation === k8sOperation.patch) {
          return mockEditMutation as never;
        }
        if (operation === k8sOperation.delete) {
          return mockDeleteMutation as never;
        }
        return mockCreateMutation as never;
      });

      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(createCustomMessages).toBeDefined();
      const messages = createCustomMessages?.(mockResource);
      expect(messages).toEqual({
        loading: {
          message: "Creating Resource",
        },
        error: {
          message: "Failed to create Resource",
        },
        success: {
          message: "Resource has been created",
          options: {
            duration: 8000,
          },
        },
      });
    });

    it("should create custom messages for edit operation", () => {
      let editCustomMessages: ((item: KubeObjectDraft) => unknown) | undefined;

      vi.mocked(useResourceCRUDMutation).mockImplementation((_mutationKey, operation, options) => {
        if (operation === k8sOperation.create) {
          return mockCreateMutation as never;
        }
        if (operation === k8sOperation.patch && options?.createCustomMessages) {
          editCustomMessages = options.createCustomMessages;
          return mockEditMutation as never;
        }
        if (operation === k8sOperation.delete) {
          return mockDeleteMutation as never;
        }
        return mockEditMutation as never;
      });

      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(editCustomMessages).toBeDefined();
      const messages = editCustomMessages?.(mockResource);
      expect(messages).toEqual({
        loading: {
          message: "Patching Resource",
        },
        error: {
          message: "Failed to patch Resource",
        },
        success: {
          message: "Resource has been patched",
          options: {
            duration: 8000,
          },
        },
      });
    });

    it("should create custom messages for delete operation", () => {
      let deleteCustomMessages: ((item: KubeObjectDraft) => unknown) | undefined;

      vi.mocked(useResourceCRUDMutation).mockImplementation((_mutationKey, _operation, options) => {
        if (options?.createCustomMessages) {
          deleteCustomMessages = options.createCustomMessages;
        }
        return mockDeleteMutation as never;
      });

      renderHook(() => useBasicCRUD(mockResourceConfig), {
        wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
      });

      expect(deleteCustomMessages).toBeDefined();
      const messages = deleteCustomMessages?.(mockResource);
      expect(messages).toEqual({
        loading: {
          message: "Deleting Resource",
        },
        error: {
          message: "Failed to delete Resource",
        },
        success: {
          message: "Resource has been marked for deletion",
          options: {
            duration: 8000,
          },
        },
      });
    });
  });
});
