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
    editNexusIntegrationSecret: vi.fn((secret: Secret, input: { username: string; password: string; url: string }) => ({
      ...secret,
      data: {
        username: btoa(input.username),
        password: btoa(input.password),
        url: btoa(input.url),
      },
    })),
  };
});

describe("k8sManageNexusIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockQuickLink: QuickLink = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "QuickLink",
    metadata: { name: "nexus", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    spec: { type: "default", url: "https://nexus.example.com", icon: "nexus", visible: true },
  };

  const mockSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: { name: "ci-nexus", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    type: "Opaque",
    data: { username: btoa("test-user"), password: btoa("test-password"), url: btoa("https://nexus.example.com") },
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
        secret: { username: "test-user", password: "test-password", url: "https://nexus.example.com" },
      };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(mockSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageNexusIntegration(input);
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
          username: "updated-user",
          password: "updated-password",
          url: "https://nexus-new.example.com",
          currentResource: mockSecret,
        },
      };
      const updatedSecret = {
        ...mockSecret,
        data: {
          username: btoa("updated-user"),
          password: btoa("updated-password"),
          url: btoa("https://nexus-new.example.com"),
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageNexusIntegration(input);
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
        quickLink: { name: "nexus", externalUrl: "https://nexus-updated.example.com", currentResource: mockQuickLink },
        secret: {
          username: "test-user",
          password: "test-password",
          url: "https://nexus.example.com",
          currentResource: mockSecret,
        },
      };
      const updatedQuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://nexus-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageNexusIntegration(input);
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
        quickLink: { name: "nexus", externalUrl: "https://nexus-updated.example.com", currentResource: mockQuickLink },
        secret: {
          username: "updated-user",
          password: "updated-password",
          url: "https://nexus-updated.example.com",
          currentResource: mockSecret,
        },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          username: btoa("updated-user"),
          password: btoa("updated-password"),
          url: btoa("https://nexus-updated.example.com"),
        },
      };
      const updatedQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://nexus-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageNexusIntegration(input);
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
        secret: { username: "test-user", password: "test-password", url: "https://nexus.example.com" },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageNexusIntegration(input as never)).rejects.toThrow(
        "currentResource is required for secret in edit mode"
      );
    });

    it("should require currentResource for quickLink in edit mode when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: false },
        quickLink: { name: "nexus", externalUrl: "https://nexus.example.com" },
        secret: {
          username: "test-user",
          password: "test-password",
          url: "https://nexus.example.com",
          currentResource: mockSecret,
        },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageNexusIntegration(input as never)).rejects.toThrow(
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
        secret: { username: "test-user", password: "test-password", url: "https://nexus.example.com" },
      };
      mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Failed to create secret"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageNexusIntegration(input)).rejects.toThrow("Failed to create secret");
    });

    it("should leave first operation completed if second operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { quickLink: true, secret: true },
        quickLink: { name: "nexus", externalUrl: "https://nexus-updated.example.com", currentResource: mockQuickLink },
        secret: {
          username: "updated-user",
          password: "updated-password",
          url: "https://nexus-updated.example.com",
          currentResource: mockSecret,
        },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          username: btoa("updated-user"),
          password: btoa("updated-password"),
          url: btoa("https://nexus-updated.example.com"),
        },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockRejectedValueOnce(new Error("Failed to update QuickLink"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageNexusIntegration(input)).rejects.toThrow("Failed to update QuickLink");
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
          username: "test-user",
          password: "test-password",
          url: "https://nexus.example.com",
          currentResource: mockSecret,
        },
      };
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageNexusIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
