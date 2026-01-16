import { describe, it, expect } from "vitest";
import { createGitServerDraft } from "./index.js";
import { ZodError } from "zod";
import { k8sGitServerConfig, gitProvider } from "../../../../groups/KRCI/index.js";

describe("createGitServerDraft", () => {
  it("should create a valid GitServer draft", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "github-ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = createGitServerDraft(input);

    expect(result).toMatchObject({
      apiVersion: k8sGitServerConfig.apiVersion,
      kind: k8sGitServerConfig.kind,
      metadata: {
        name: "test-gitserver",
      },
      spec: {
        gitHost: "github.com",
        gitProvider: "github",
        nameSshKeySecret: "github-ssh-key",
        gitUser: "git",
        httpsPort: 443,
        sshPort: 22,
        skipWebhookSSLVerification: false,
      },
    });

    expect(result.spec.webhookUrl).toBeUndefined();
  });

  it("should create GitServer draft with webhookUrl", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "github-ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
      webhookUrl: "https://webhook.example.com/events",
    };

    const result = createGitServerDraft(input);

    expect(result.spec.webhookUrl).toBe("https://webhook.example.com/events");
  });

  it("should handle gerrit provider", () => {
    const input = {
      name: "gerrit-server",
      gitHost: "gerrit.example.com",
      gitProvider: "gerrit" as const,
      nameSshKeySecret: "gerrit-ssh-key",
      gitUser: "gerrit",
      httpsPort: 8080,
      sshPort: 29418,
      skipWebhookSSLVerification: true,
    };

    const result = createGitServerDraft(input);

    expect(result.spec.gitProvider).toBe("gerrit");
    expect(result.spec.httpsPort).toBe(8080);
    expect(result.spec.sshPort).toBe(29418);
  });

  it("should handle gitlab provider", () => {
    const input = {
      name: "gitlab-server",
      gitHost: "gitlab.com",
      gitProvider: "gitlab" as const,
      nameSshKeySecret: "gitlab-ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = createGitServerDraft(input);

    expect(result.spec.gitProvider).toBe("gitlab");
  });

  it("should handle bitbucket provider", () => {
    const input = {
      name: "bitbucket-server",
      gitHost: "bitbucket.org",
      gitProvider: "bitbucket" as const,
      nameSshKeySecret: "bitbucket-ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = createGitServerDraft(input);

    expect(result.spec.gitProvider).toBe("bitbucket");
  });

  it("should throw ZodError when name is missing", () => {
    const input = {
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when gitHost is missing", () => {
    const input = {
      name: "test-gitserver",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when gitProvider is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when nameSshKeySecret is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when gitUser is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when httpsPort is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when sshPort is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when skipWebhookSSLVerification is missing", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when httpsPort is not a number", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: "443",
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when sshPort is not a number", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: "22",
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError for invalid gitProvider", () => {
    const input = {
      name: "test-gitserver",
      gitHost: "github.com",
      gitProvider: "invalid-provider",
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    } as any;

    expect(() => createGitServerDraft(input)).toThrow(ZodError);
  });

  it("should handle custom ports", () => {
    const input = {
      name: "custom-gitserver",
      gitHost: "git.example.com",
      gitProvider: "gitlab" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 8443,
      sshPort: 2222,
      skipWebhookSSLVerification: true,
    };

    const result = createGitServerDraft(input);

    expect(result.spec.httpsPort).toBe(8443);
    expect(result.spec.sshPort).toBe(2222);
    expect(result.spec.skipWebhookSSLVerification).toBe(true);
  });

  it("should handle empty name", () => {
    const input = {
      name: "",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = createGitServerDraft(input);

    expect(result.metadata.name).toBe("");
  });

  it("should handle names with hyphens and numbers", () => {
    const input = {
      name: "git-server-123",
      gitHost: "github.com",
      gitProvider: "github" as const,
      nameSshKeySecret: "ssh-key-456",
      gitUser: "git",
      httpsPort: 443,
      sshPort: 22,
      skipWebhookSSLVerification: false,
    };

    const result = createGitServerDraft(input);

    expect(result.metadata.name).toBe("git-server-123");
    expect(result.spec.nameSshKeySecret).toBe("ssh-key-456");
  });
});
