import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { JiraServer, QuickLink, Secret } from "@my-project/shared";

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
    editJiraIntegrationSecret: vi.fn((secret: Secret, input: { username: string; password: string }) => ({
      ...secret,
      data: { username: btoa(input.username), password: btoa(input.password) },
    })),
    createJiraServerDraft: vi.fn((input: { url: string }) => ({
      apiVersion: "v2.edp.epam.com/v1",
      kind: "JiraServer",
      metadata: { name: "jira-server", namespace: "test-namespace" },
      spec: { apiUrl: input.url, rootUrl: input.url, credentialName: "ci-jira" },
    })),
    editJiraServer: vi.fn((jiraServer: JiraServer, input: { url: string }) => ({
      ...jiraServer,
      spec: { ...jiraServer.spec, apiUrl: input.url, rootUrl: input.url },
    })),
  };
});

describe("k8sManageJiraIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockQuickLink: QuickLink = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "QuickLink",
    metadata: { name: "jira", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    spec: { type: "default", url: "https://jira.example.com", icon: "jira", visible: true },
  };

  const mockJiraServer: JiraServer = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "JiraServer",
    metadata: { name: "jira-server", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    spec: {
      apiUrl: "https://jira.example.com/rest/api/2",
      rootUrl: "https://jira.example.com",
      credentialName: "ci-jira",
    },
  };

  const mockSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: { name: "ci-jira", namespace: "test-namespace", uid: "", creationTimestamp: "" },
    type: "Opaque",
    data: { username: btoa("test-user"), password: btoa("test-password") },
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
        dirtyFields: { jiraServer: false, quickLink: false, secret: true },
        jiraServer: { url: "https://jira.example.com" },
        secret: { username: "test-user", password: "test-password" },
      };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(mockSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageJiraIntegration(input);
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
        dirtyFields: { jiraServer: false, quickLink: false, secret: true },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        secret: { username: "updated-user", password: "updated-password", currentResource: mockSecret },
      };
      const updatedSecret = {
        ...mockSecret,
        data: { username: btoa("updated-user"), password: btoa("updated-password") },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedSecret);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageJiraIntegration(input);
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
        dirtyFields: { jiraServer: false, quickLink: true, secret: false },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        quickLink: { name: "jira", externalUrl: "https://jira-updated.example.com", currentResource: mockQuickLink },
        secret: { username: "test-user", password: "test-password", currentResource: mockSecret },
      };
      const updatedQuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://jira-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageJiraIntegration(input);
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
        dirtyFields: { jiraServer: false, quickLink: true, secret: true },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        quickLink: { name: "jira", externalUrl: "https://jira-updated.example.com", currentResource: mockQuickLink },
        secret: { username: "updated-user", password: "updated-password", currentResource: mockSecret },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: { username: btoa("updated-user"), password: btoa("updated-password") },
      };
      const updatedQuickLink: QuickLink = {
        ...mockQuickLink,
        spec: { ...mockQuickLink.spec, url: "https://jira-updated.example.com" },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockResolvedValueOnce(updatedQuickLink);
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageJiraIntegration(input);
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
        dirtyFields: { jiraServer: false, quickLink: false, secret: true },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        secret: { username: "test-user", password: "test-password" },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageJiraIntegration(input as never)).rejects.toThrow(
        "currentResource is required for secret in edit mode"
      );
    });

    it("should require currentResource for quickLink in edit mode when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { jiraServer: false, quickLink: true, secret: false },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        quickLink: { name: "jira", externalUrl: "https://jira.example.com" },
        secret: { username: "test-user", password: "test-password", currentResource: mockSecret },
      };
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageJiraIntegration(input as never)).rejects.toThrow(
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
        dirtyFields: { jiraServer: false, quickLink: false, secret: true },
        jiraServer: { url: "https://jira.example.com" },
        secret: { username: "test-user", password: "test-password" },
      };
      mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Failed to create secret"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageJiraIntegration(input)).rejects.toThrow("Failed to create secret");
    });

    it("should leave first operation completed if second operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { jiraServer: false, quickLink: true, secret: true },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        quickLink: { name: "jira", externalUrl: "https://jira-updated.example.com", currentResource: mockQuickLink },
        secret: { username: "updated-user", password: "updated-password", currentResource: mockSecret },
      };
      const updatedSecret: Secret = {
        ...mockSecret,
        data: { username: btoa("updated-user"), password: btoa("updated-password") },
      };
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockRejectedValueOnce(new Error("Failed to update QuickLink"));
      const caller = createCaller(mockContext);
      await expect(caller.k8s.manageJiraIntegration(input)).rejects.toThrow("Failed to update QuickLink");
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("no-op scenarios", () => {
    it("should not update anything when no fields are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: { jiraServer: false, quickLink: false, secret: false },
        jiraServer: { url: "https://jira.example.com", currentResource: mockJiraServer },
        secret: { username: "test-user", password: "test-password", currentResource: mockSecret },
      };
      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageJiraIntegration(input);
      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.quickLink).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
