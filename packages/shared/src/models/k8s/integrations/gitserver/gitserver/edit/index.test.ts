import { describe, it, expect } from "vitest";
import { editGitServer } from "./index.js";
import { GitServer, k8sGitServerConfig } from "../../../../groups/KRCI/index.js";
import { ZodError } from "zod";
import { KubeMetadata } from "../../../../common/types.js";

describe("editGitServer", () => {
  const createExistingGitServer = (): GitServer => ({
    apiVersion: k8sGitServerConfig.apiVersion,
    kind: k8sGitServerConfig.kind,
    metadata: {
      name: "test-gitserver",
      namespace: "default",
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
    spec: {
      gitHost: "old-github.com",
      gitProvider: "github",
      nameSshKeySecret: "old-ssh-key",
      gitUser: "old-git-user",
      httpsPort: 8080,
      sshPort: 2222,
      skipWebhookSSLVerification: true,
      webhookUrl: "https://old-webhook.example.com",
    },
    status: {},
  });

  it("should update all fields while preserving metadata", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "new-github.com",
      gitProvider: "gitlab" as const,
      nameSshKeySecret: "new-ssh-key",
      gitUser: "new-git-user",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
      webhookUrl: "https://new-webhook.example.com",
    };

    const result = editGitServer(existingGitServer, input);

    expect(result.spec.gitHost).toBe("new-github.com");
    expect(result.spec.gitProvider).toBe("gitlab");
    expect(result.spec.nameSshKeySecret).toBe("new-ssh-key");
    expect(result.spec.gitUser).toBe("new-git-user");
    expect(result.spec.httpsPort).toBe(443);
    expect(result.spec.sshPort).toBe(22);
    expect(result.spec.skipWebhookSSLVerification).toBe(false);
    expect(result.spec.webhookUrl).toBe("https://new-webhook.example.com");

    expect(result.metadata.name).toBe("test-gitserver");
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.resourceVersion).toBe("12345");

    expect(existingGitServer.spec.gitHost).toBe("old-github.com");
  });

  it("should remove webhookUrl when not provided", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = editGitServer(existingGitServer, input);

    expect(result.spec.webhookUrl).toBeUndefined();
  });

  it("should throw ZodError when gitHost is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when gitProvider is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when nameSshKeySecret is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when gitUser is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when httpsPort is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when sshPort is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when skipWebhookSSLVerification is missing", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should create spec object if it doesn't exist", () => {
    const existingGitServer: GitServer = {
      apiVersion: k8sGitServerConfig.apiVersion,
      kind: k8sGitServerConfig.kind,
      metadata: {
        name: "test-gitserver",
      },
    } as any;

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = editGitServer(existingGitServer, input);

    expect(result.spec).toBeDefined();
    expect(result.spec.gitHost).toBe("github.com");
  });

  it("should handle different git providers", () => {
    const existingGitServer = createExistingGitServer();

    const testCases = [
      { provider: "gerrit" as const, port: 29418 },
      { provider: "github" as const, port: 22 },
      { provider: "gitlab" as const, port: 22 },
      { provider: "bitbucket" as const, port: 22 },
    ];

    testCases.forEach(({ provider, port }) => {
      const input = {
        gitHost: `${provider}.example.com`,
        gitProvider: provider,
        nameSshKeySecret: `${provider}-ssh-key`,
        gitUser: "git",
        httpsPort: 443,
        sshPort: port,
        skipWebhookSSLVerification: false,
      };

      const result = editGitServer(existingGitServer, input);

      expect(result.spec.gitProvider).toBe(provider);
      expect(result.spec.sshPort).toBe(port);
    });
  });

  it("should not modify the original GitServer object", () => {
    const existingGitServer = createExistingGitServer();
    const originalGitHost = existingGitServer.spec.gitHost;

    const input = {
      gitHost: "modified-github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    editGitServer(existingGitServer, input);

    expect(existingGitServer.spec.gitHost).toBe(originalGitHost);
  });

  it("should throw ZodError for invalid gitProvider", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "invalid-provider",
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should throw ZodError when ports are not numbers", () => {
    const existingGitServer = createExistingGitServer();

    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: "443",
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => editGitServer(existingGitServer, input)).toThrow(ZodError);
  });

  it("should preserve metadata without modifications", () => {
    const existingGitServer: GitServer = {
      apiVersion: k8sGitServerConfig.apiVersion,
      kind: k8sGitServerConfig.kind,
      metadata: {
        name: "test-gitserver",
        namespace: "production",
        labels: {
          "app.kubernetes.io/name": "gitserver",
          "custom-label": "custom-value",
        },
        annotations: {
          "annotation-1": "value-1",
        },
        resourceVersion: "54321",
        uid: "test-uid-456",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        gitHost: "old-github.com",
        gitProvider: "github",
        nameSshKeySecret: "old-ssh-key",
        gitUser: "git",
        httpsPort: 443,
        sshPort: 22,
        skipWebhookSSLVerification: false,
      },
      status: {},
    };

    const input = {
      gitHost: "new-github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "new-ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = editGitServer(existingGitServer, input);

    expect(result.metadata).toEqual(existingGitServer.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });
});
