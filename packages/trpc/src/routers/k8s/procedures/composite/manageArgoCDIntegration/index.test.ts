import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { QuickLink, Secret } from "@my-project/shared";

// Mock K8sClient
vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

// Mock the editQuickLinkURL and editArgoCDIntegrationSecret functions
vi.mock("@my-project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@my-project/shared")>();
  return {
    ...actual,
    editQuickLinkURL: vi.fn((quickLink: QuickLink, input: { url: string }) => ({
      ...quickLink,
      spec: {
        ...quickLink.spec,
        url: input.url,
      },
    })),
    editArgoCDIntegrationSecret: vi.fn((secret: Secret, input: { token: string; url: string }) => ({
      ...secret,
      data: {
        token: btoa(input.token),
        url: btoa(input.url),
      },
    })),
  };
});

describe("k8sManageArgoCDIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockQuickLink: QuickLink = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "QuickLink",
    metadata: {
      name: "argocd",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    spec: {
      type: "default",
      url: "https://argocd.example.com",
      icon: "argocd",
      visible: true,
    },
  };

  const mockSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "ci-argocd",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    type: "Opaque",
    data: {
      token: btoa("test-token"),
      url: btoa("https://argocd.example.com"),
    },
  };

  beforeEach(() => {
    mockContext = createMockedContext();

    mockK8sClientInstance = {
      KubeConfig: {},
      createResource: vi.fn(),
      replaceResource: vi.fn(),
    };

    (K8sClient as unknown as Mock).mockImplementation(() => mockK8sClientInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode", () => {
    it("should create secret in create mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: {
          quickLink: false,
          secret: true,
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
        },
      };

      const createdSecret = { ...mockSecret };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(createdSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageArgoCDIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(createdSecret);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(1);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "Secret" }),
        "test-namespace",
        expect.objectContaining({
          kind: "Secret",
          data: expect.objectContaining({
            token: expect.any(String),
            url: expect.any(String),
          }),
        })
      );
    });
  });

  describe("edit mode", () => {
    it("should only update secret when only secret is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: false,
          secret: true,
        },
        secret: {
          token: "updated-token",
          url: "https://argocd-new.example.com",
          currentResource: mockSecret,
        },
      };

      const updatedSecret = {
        ...mockSecret,
        data: { token: btoa("updated-token"), url: btoa("https://argocd-new.example.com") },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageArgoCDIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(updatedSecret);
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should only update quickLink when only quickLink is dirty", async () => {
      const completeQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: {
          ...mockQuickLink.spec,
          url: "https://argocd.example.com",
        },
      };

      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: true,
          secret: false,
        },
        quickLink: {
          name: "argocd",
          externalUrl: "https://argocd-updated.example.com",
          currentResource: completeQuickLink,
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
          currentResource: mockSecret,
        },
      };

      const updatedQuickLink: QuickLink = {
        ...completeQuickLink,
        spec: { ...completeQuickLink.spec, url: "https://argocd-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedQuickLink);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageArgoCDIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toEqual(updatedQuickLink);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should update both resources when both are dirty", async () => {
      const completeQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: {
          ...mockQuickLink.spec,
          url: "https://argocd.example.com",
        },
      };

      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: true,
          secret: true,
        },
        quickLink: {
          name: "argocd",
          externalUrl: "https://argocd-updated.example.com",
          currentResource: completeQuickLink,
        },
        secret: {
          token: "updated-token",
          url: "https://argocd-updated.example.com",
          currentResource: mockSecret,
        },
      };

      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          token: btoa("updated-token"),
          url: btoa("https://argocd-updated.example.com"),
        },
      };
      const updatedQuickLink: QuickLink = {
        ...completeQuickLink,
        spec: { ...completeQuickLink.spec, url: "https://argocd-updated.example.com" },
      };

      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockResolvedValueOnce(updatedQuickLink);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageArgoCDIntegration(input);

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
        dirtyFields: {
          quickLink: false,
          secret: true,
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
          // currentResource missing
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageArgoCDIntegration(input as any)).rejects.toThrow(
        "currentResource is required for secret in edit mode"
      );
    });

    it("should require currentResource for quickLink in edit mode when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: true,
          secret: false,
        },
        quickLink: {
          name: "argocd",
          externalUrl: "https://argocd.example.com",
          // currentResource missing
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
          currentResource: mockSecret,
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageArgoCDIntegration(input as any)).rejects.toThrow(
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
        dirtyFields: {
          quickLink: false,
          secret: true,
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
        },
      };

      mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Failed to create secret"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageArgoCDIntegration(input)).rejects.toThrow("Failed to create secret");
    });

    it("should leave first operation completed if second operation fails", async () => {
      const completeQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: {
          ...mockQuickLink.spec,
          url: "https://argocd.example.com",
        },
      };

      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: true,
          secret: true,
        },
        quickLink: {
          name: "argocd",
          externalUrl: "https://argocd-updated.example.com",
          currentResource: completeQuickLink,
        },
        secret: {
          token: "updated-token",
          url: "https://argocd-updated.example.com",
          currentResource: mockSecret,
        },
      };

      const updatedSecret: Secret = {
        ...mockSecret,
        data: {
          token: btoa("updated-token"),
          url: btoa("https://argocd-updated.example.com"),
        },
      };

      // Secret update succeeds, QuickLink update fails
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockRejectedValueOnce(new Error("Failed to update QuickLink"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageArgoCDIntegration(input)).rejects.toThrow("Failed to update QuickLink");

      // Verify only 2 calls: 1 for secret (succeeded), 1 for quickLink (failed)
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("no-op scenarios", () => {
    it("should not update anything when no fields are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          quickLink: false,
          secret: false,
        },
        secret: {
          token: "test-token",
          url: "https://argocd.example.com",
          currentResource: mockSecret,
        },
      };

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageArgoCDIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
