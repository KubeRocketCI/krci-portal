import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { QuickLink, Secret } from "@my-project/shared";

vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

vi.mock("@my-project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@my-project/shared")>();
  return {
    ...actual,
    editQuickLinkURL: vi.fn((quickLink: QuickLink, input: { url: string }) => ({
      ...quickLink,
      spec: { ...quickLink.spec, url: input.url },
    })),
    editChatAssistantIntegrationSecret: vi.fn(
      (secret: Secret, input: { apiUrl: string; token: string; assistantId: string }) => ({
        ...secret,
        data: {
          apiUrl: btoa(input.apiUrl),
          token: btoa(input.token),
          assistantId: btoa(input.assistantId),
        },
      })
    ),
  };
});

describe("k8sManageChatAssistantIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockQuickLink: QuickLink = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "QuickLink",
    metadata: { name: "chat-assistant", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    spec: { type: "default", url: "https://chat.example.com", icon: "chat-assistant", visible: true },
  };

  const mockSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: { name: "ci-chat-assistant", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    type: "Opaque",
    data: {
      apiUrl: btoa("https://api.chat.example.com"),
      token: btoa("test-token"),
      assistantId: btoa("assistant-123"),
    },
  };

  beforeEach(() => {
    mockContext = createMockedContext();
    mockK8sClientInstance = { KubeConfig: {}, createResource: vi.fn(), replaceResource: vi.fn() };
    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => vi.clearAllMocks());

  describe("create mode", () => {
    it("should create secret in create mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: { quickLink: false, secret: true },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
        },
      };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(mockSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageChatAssistantIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(mockSecret);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(1);
    });
  });

  describe("edit mode", () => {
    it("should only update secret when only secret is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: false, secret: true },
        secret: {
          apiUrl: "https://api.chat-new.example.com",
          token: "updated-token",
          assistantId: "assistant-456",
          currentResource: mockSecret,
        },
      };
      const updatedSecret = {
        ...mockSecret,
        data: {
          apiUrl: btoa("https://api.chat-new.example.com"),
          token: btoa("updated-token"),
          assistantId: btoa("assistant-456"),
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageChatAssistantIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(updatedSecret);
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should only update quickLink when only quickLink is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: false },
        quickLink: {
          name: "chat-assistant",
          externalUrl: "https://chat-updated.example.com",
          currentResource: mockQuickLink,
        },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
          currentResource: mockSecret,
        },
      };
      const updatedQuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://chat-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageChatAssistantIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toEqual(updatedQuickLink);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should update both resources when both are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: true },
        quickLink: {
          name: "chat-assistant",
          externalUrl: "https://chat-updated.example.com",
          currentResource: mockQuickLink,
        },
        secret: {
          apiUrl: "https://api.chat-updated.example.com",
          token: "updated-token",
          assistantId: "assistant-456",
          currentResource: mockSecret,
        },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          apiUrl: btoa("https://api.chat-updated.example.com"),
          token: btoa("updated-token"),
          assistantId: btoa("assistant-456"),
        },
      };
      const updatedQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://chat-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageChatAssistantIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(updatedSecret);
      expect(result.data.quickLink).toEqual(updatedQuickLink);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("validation", () => {
    it("should require currentResource for secret in edit mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: false, secret: true },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
        },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageChatAssistantIntegration(input as never)).rejects.toThrow(
        "currentResource is required for secret in edit mode"
      );
    });

    it("should require currentResource for quickLink in edit mode when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: false },
        quickLink: { name: "chat-assistant", externalUrl: "https://chat.example.com" },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
          currentResource: mockSecret,
        },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageChatAssistantIntegration(input as never)).rejects.toThrow(
        "currentResource is required for quickLink in edit mode"
      );
    });
  });

  describe("fail-fast behavior", () => {
    it("should stop execution if first operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: { quickLink: false, secret: true },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
        },
      };
      mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Failed to create secret"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageChatAssistantIntegration(input)).rejects.toThrow("Failed to create secret");
    });

    it("should leave first operation completed if second operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: true },
        quickLink: {
          name: "chat-assistant",
          externalUrl: "https://chat-updated.example.com",
          currentResource: mockQuickLink,
        },
        secret: {
          apiUrl: "https://api.chat-updated.example.com",
          token: "updated-token",
          assistantId: "assistant-456",
          currentResource: mockSecret,
        },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          apiUrl: btoa("https://api.chat-updated.example.com"),
          token: btoa("updated-token"),
          assistantId: btoa("assistant-456"),
        },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockRejectedValueOnce(new Error("Failed to update QuickLink"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageChatAssistantIntegration(input)).rejects.toThrow("Failed to update QuickLink");
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("no-op scenarios", () => {
    it("should not update anything when no fields are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: false, secret: false },
        secret: {
          apiUrl: "https://api.chat.example.com",
          token: "test-token",
          assistantId: "assistant-123",
          currentResource: mockSecret,
        },
      };
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageChatAssistantIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
