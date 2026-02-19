import { createMockedContext } from "../../../../../__mocks__/context.js";
import { createCaller } from "../../../../../routers/index.js";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { K8sClient } from "../../../../../clients/k8s/index.js";
import { GitServer, Secret } from "@my-project/shared";

// Mock K8sClient
vi.mock("../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

// Mock the edit and create functions from shared
vi.mock("@my-project/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@my-project/shared")>();
  return {
    ...actual,
    createGitServerDraft: vi.fn((input: any) => ({
      apiVersion: "v2.edp.epam.com/v1",
      kind: "GitServer",
      metadata: {
        name: input.name,
        namespace: "test-namespace",
      },
      spec: {
        gitHost: input.gitHost,
        gitProvider: input.gitProvider,
        gitUser: input.gitUser,
        nameSshKeySecret: input.nameSshKeySecret,
        sshPort: input.sshPort,
        httpsPort: input.httpsPort,
        skipWebhookSSLVerification: input.skipWebhookSSLVerification,
        ...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
      },
    })),
    createGitServerSecretDraft: vi.fn((input: any) => {
      if (input.gitProvider === "gerrit") {
        return {
          apiVersion: "v1",
          kind: "Secret",
          metadata: {
            name: "gerrit-ciuser-sshkey",
            namespace: "test-namespace",
          },
          type: "Opaque",
          data: {
            id_rsa: btoa(input.sshPrivateKey),
            "id_rsa.pub": btoa(input.sshPublicKey),
          },
        };
      }
      return {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: `${input.gitProvider}-access-token`,
          namespace: "test-namespace",
        },
        type: "Opaque",
        data: {
          token: btoa(input.token),
          id_rsa: btoa(input.sshPrivateKey),
        },
      };
    }),
    editGitServer: vi.fn((gitServer: GitServer, input: any) => ({
      ...gitServer,
      spec: {
        ...gitServer.spec,
        gitHost: input.gitHost,
        gitProvider: input.gitProvider,
        gitUser: input.gitUser,
        nameSshKeySecret: input.nameSshKeySecret,
        sshPort: input.sshPort,
        httpsPort: input.httpsPort,
        skipWebhookSSLVerification: input.skipWebhookSSLVerification,
        ...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
      },
    })),
    editGitServerSecret: vi.fn((secret: Secret, input: any) => {
      if (input.gitProvider === "gerrit") {
        return {
          ...secret,
          data: {
            id_rsa: btoa(input.sshPrivateKey),
            "id_rsa.pub": btoa(input.sshPublicKey),
          },
        };
      }
      return {
        ...secret,
        data: {
          token: btoa(input.token),
          id_rsa: btoa(input.sshPrivateKey),
        },
      };
    }),
  };
});

describe("k8sManageGitServerIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let mockK8sClientInstance: {
    KubeConfig: {};
    createResource: Mock;
    replaceResource: Mock;
  };

  const mockGitServer: GitServer = {
    apiVersion: "v2.edp.epam.com/v1",
    kind: "GitServer",
    metadata: {
      name: "github",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    spec: {
      gitHost: "github.com",
      gitProvider: "github",
      gitUser: "git",
      nameSshKeySecret: "github-access-token",
      sshPort: 22,
      httpsPort: 443,
      skipWebhookSSLVerification: false,
    },
    status: {},
  };

  const mockGitHubSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "github-access-token",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    type: "Opaque",
    data: {
      token: btoa("ghp_test_token_123"),
      id_rsa: btoa("-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----"),
    },
  };

  const mockGerritSecret: Secret = {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: "gerrit-ciuser-sshkey",
      namespace: "test-namespace",
      uid: "",
      creationTimestamp: "",
    },
    type: "Opaque",
    data: {
      id_rsa: btoa("-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----"),
      "id_rsa.pub": btoa("ssh-rsa AAAAB3... test@example.com"),
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

  describe("create mode - GitHub", () => {
    it("should create both GitServer and Secret in create mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: {
          gitServer: true,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
        },
      };

      const createdSecret = { ...mockGitHubSecret };
      const createdGitServer = { ...mockGitServer };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(createdSecret).mockResolvedValueOnce(createdGitServer);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(createdSecret);
      expect(result.data.gitServer).toEqual(createdGitServer);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(2);
    });

    it("should create only secret when only secret is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: {
          gitServer: false,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
        },
      };

      const createdSecret = { ...mockGitHubSecret };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(createdSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(createdSecret);
      expect(result.data.gitServer).toBeUndefined();
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(1);
    });
  });

  describe("create mode - Gerrit", () => {
    it("should create Gerrit secret with ssh keys", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "create" as const,
        dirtyFields: {
          gitServer: false,
          secret: true,
        },
        gitServer: {
          name: "gerrit",
          gitHost: "gerrit.example.com",
          gitProvider: "gerrit" as const,
          gitUser: "ciuser",
          nameSshKeySecret: "gerrit-ciuser-sshkey",
          sshPort: 29418,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
        },
        secret: {
          gitProvider: "gerrit" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          sshPublicKey: "ssh-rsa AAAAB3... test@example.com",
        },
      };

      const createdSecret = { ...mockGerritSecret };
      mockK8sClientInstance.createResource.mockResolvedValueOnce(createdSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(createdSecret);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(1);
    });
  });

  describe("edit mode - GitHub", () => {
    it("should only update secret when only secret is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: false,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\nupdated-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_updated_token_456",
          currentResource: mockGitHubSecret,
        },
      };

      const updatedSecret = {
        ...mockGitHubSecret,
        data: {
          token: btoa("ghp_updated_token_456"),
          id_rsa: btoa("-----BEGIN OPENSSH PRIVATE KEY-----\nupdated-key\n-----END OPENSSH PRIVATE KEY-----"),
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedSecret);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(updatedSecret);
      expect(result.data.gitServer).toBeUndefined();
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should only update gitServer when only gitServer is dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: true,
          secret: false,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 2222,
          httpsPort: 443,
          skipWebhookSSLVerification: true,
          webhookUrl: "https://webhook.example.com",
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
          currentResource: mockGitHubSecret,
        },
      };

      const updatedGitServer: GitServer = {
        ...mockGitServer,
        spec: {
          ...mockGitServer.spec,
          sshPort: 2222,
          skipWebhookSSLVerification: true,
          webhookUrl: "https://webhook.example.com",
        },
      };
      mockK8sClientInstance.replaceResource.mockResolvedValueOnce(updatedGitServer);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.gitServer).toEqual(updatedGitServer);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("should update both resources when both are dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: true,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 2222,
          httpsPort: 443,
          skipWebhookSSLVerification: true,
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\nupdated-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_updated_token_456",
          currentResource: mockGitHubSecret,
        },
      };

      const updatedSecret: Secret = {
        ...mockGitHubSecret,
        data: {
          token: btoa("ghp_updated_token_456"),
          id_rsa: btoa("-----BEGIN OPENSSH PRIVATE KEY-----\nupdated-key\n-----END OPENSSH PRIVATE KEY-----"),
        },
      };
      const updatedGitServer: GitServer = {
        ...mockGitServer,
        spec: { ...mockGitServer.spec, sshPort: 2222, skipWebhookSSLVerification: true },
      };

      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockResolvedValueOnce(updatedGitServer);

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toEqual(updatedSecret);
      expect(result.data.gitServer).toEqual(updatedGitServer);
      expect(mockK8sClientInstance.replaceResource).toHaveBeenCalledTimes(2);
    });
  });

  describe("validation", () => {
    it("should create secret when currentResource is missing in edit mode", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: false,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
          // currentResource missing - should create new secret
        },
      };

      const caller = createCaller(mockContext);

      const result = await caller.k8s.manageGitServerIntegration(input as any);

      expect(result.success).toBe(true);
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "Secret" }),
        "test-namespace",
        expect.objectContaining({
          kind: "Secret",
          metadata: expect.objectContaining({
            name: "github-access-token",
          }),
        })
      );
    });

    it("should require currentResource for gitServer in edit mode when dirty", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: true,
          secret: false,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
          // currentResource missing
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
          currentResource: mockGitHubSecret,
        },
      };

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageGitServerIntegration(input as any)).rejects.toThrow(
        "currentResource is required for gitServer in edit mode"
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
          gitServer: true,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
        },
      };

      mockK8sClientInstance.createResource.mockRejectedValueOnce(new Error("Failed to create secret"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageGitServerIntegration(input)).rejects.toThrow("Failed to create secret");
      expect(mockK8sClientInstance.createResource).toHaveBeenCalledTimes(1);
    });

    it("should leave first operation completed if second operation fails", async () => {
      const input = {
        clusterName: "test-cluster",
        namespace: "test-namespace",
        mode: "edit" as const,
        dirtyFields: {
          gitServer: true,
          secret: true,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
          currentResource: mockGitHubSecret,
        },
      };

      const updatedSecret = { ...mockGitHubSecret };

      // Secret update succeeds, GitServer update fails
      mockK8sClientInstance.replaceResource
        .mockResolvedValueOnce(updatedSecret)
        .mockRejectedValueOnce(new Error("Failed to update GitServer"));

      const caller = createCaller(mockContext);

      await expect(caller.k8s.manageGitServerIntegration(input)).rejects.toThrow("Failed to update GitServer");

      // Verify 2 calls: secret (succeeded), gitServer (failed)
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
          gitServer: false,
          secret: false,
        },
        gitServer: {
          name: "github",
          gitHost: "github.com",
          gitProvider: "github" as const,
          gitUser: "git",
          nameSshKeySecret: "github-access-token",
          sshPort: 22,
          httpsPort: 443,
          skipWebhookSSLVerification: false,
          currentResource: mockGitServer,
        },
        secret: {
          gitProvider: "github" as const,
          sshPrivateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\ntest-key\n-----END OPENSSH PRIVATE KEY-----",
          token: "ghp_test_token_123",
          currentResource: mockGitHubSecret,
        },
      };

      const caller = createCaller(mockContext);
      const result = await caller.k8s.manageGitServerIntegration(input);

      expect(result.success).toBe(true);
      expect(result.data.secret).toBeUndefined();
      expect(result.data.gitServer).toBeUndefined();
      expect(mockK8sClientInstance.createResource).not.toHaveBeenCalled();
      expect(mockK8sClientInstance.replaceResource).not.toHaveBeenCalled();
    });
  });
});
