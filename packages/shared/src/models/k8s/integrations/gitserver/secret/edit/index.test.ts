import { describe, it, expect } from "vitest";
import { editGitServerSecret } from "./index.js";
import { Secret } from "../../../../groups/Core/index.js";
import { ZodError } from "zod";
import { gitProvider } from "../../../../groups/KRCI/index.js";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";
import { KubeMetadata } from "../../../../common/types.js";

describe("editGitServerSecret", () => {
  describe("GitHub provider", () => {
    const createExistingGitHubSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "ci-github",
        namespace: "default",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "repository",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        id_rsa: Buffer.from("old-ssh-key\n", "utf-8").toString("base64"),
        token: Buffer.from("old-token", "utf-8").toString("base64"),
        username: Buffer.from("git", "utf-8").toString("base64"),
      },
    });

    it("should update GitHub secret while preserving metadata", () => {
      const existingSecret = createExistingGitHubSecret();

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "new-ssh-key",
        token: "new-token-123",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedKey = Buffer.from(result.data?.id_rsa as string, "base64").toString("utf-8");
      const decodedToken = Buffer.from(result.data?.token as string, "base64").toString("utf-8");
      const decodedUsername = Buffer.from(result.data?.username as string, "base64").toString("utf-8");

      expect(decodedKey).toBe("new-ssh-key\n");
      expect(decodedToken).toBe("new-token-123");
      expect(decodedUsername).toBe("git");

      expect(result.metadata.name).toBe("ci-github");
      expect(result.metadata.namespace).toBe("default");
    });

    it("should throw ZodError when token is missing for GitHub", () => {
      const existingSecret = createExistingGitHubSecret();

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "new-ssh-key",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });
  });

  describe("GitLab provider", () => {
    const createExistingGitLabSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "ci-gitlab",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "repository",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        id_rsa: Buffer.from("old-ssh-key\n", "utf-8").toString("base64"),
        token: Buffer.from("old-token", "utf-8").toString("base64"),
      },
    });

    it("should update GitLab secret", () => {
      const existingSecret = createExistingGitLabSecret();

      const input = {
        gitProvider: gitProvider.gitlab,
        sshPrivateKey: "new-gitlab-key",
        token: "glpat-new-token",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedToken = Buffer.from(result.data?.token as string, "base64").toString("utf-8");
      expect(decodedToken).toBe("glpat-new-token");
    });

    it("should throw ZodError when token is missing for GitLab", () => {
      const existingSecret = createExistingGitLabSecret();

      const input = {
        gitProvider: gitProvider.gitlab,
        sshPrivateKey: "new-key",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });
  });

  describe("Bitbucket provider", () => {
    const createExistingBitbucketSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "ci-bitbucket",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "repository",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        id_rsa: Buffer.from("old-ssh-key\n", "utf-8").toString("base64"),
        token: Buffer.from("old-token", "utf-8").toString("base64"),
      },
    });

    it("should update Bitbucket secret", () => {
      const existingSecret = createExistingBitbucketSecret();

      const input = {
        gitProvider: gitProvider.bitbucket,
        sshPrivateKey: "new-bitbucket-key",
        token: "new-bitbucket-token",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedToken = Buffer.from(result.data?.token as string, "base64").toString("utf-8");
      expect(decodedToken).toBe("new-bitbucket-token");
    });
  });

  describe("Gerrit provider", () => {
    const createExistingGerritSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "gerrit-ciuser-sshkey",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "repository",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        id_rsa: Buffer.from("old-ssh-key\n", "utf-8").toString("base64"),
        "id_rsa.pub": Buffer.from("old-public-key", "utf-8").toString("base64"),
        username: Buffer.from("edp-ci", "utf-8").toString("base64"),
      },
    });

    it("should update Gerrit secret with public and private keys", () => {
      const existingSecret = createExistingGerritSecret();

      const input = {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "new-gerrit-private-key",
        sshPublicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedPrivateKey = Buffer.from(result.data?.id_rsa as string, "base64").toString("utf-8");
      const decodedPublicKey = Buffer.from(result.data?.["id_rsa.pub"] as string, "base64").toString("utf-8");
      const decodedUsername = Buffer.from(result.data?.username as string, "base64").toString("utf-8");

      expect(decodedPrivateKey).toBe("new-gerrit-private-key\n");
      expect(decodedPublicKey).toBe("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...");
      expect(decodedUsername).toBe("edp-ci");
      expect(result.data?.token).toBeUndefined();
    });

    it("should throw ZodError when sshPublicKey is missing for Gerrit", () => {
      const existingSecret = createExistingGerritSecret();

      const input = {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "new-key",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });
  });

  describe("validation", () => {
    const createExistingSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "ci-github",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        id_rsa: Buffer.from("old-key\n", "utf-8").toString("base64"),
        token: Buffer.from("old-token", "utf-8").toString("base64"),
      },
    });

    it("should throw ZodError when gitProvider is missing", () => {
      const existingSecret = createExistingSecret();

      const input = {
        sshPrivateKey: "new-key",
        token: "new-token",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should throw ZodError when sshPrivateKey is missing", () => {
      const existingSecret = createExistingSecret();

      const input = {
        gitProvider: gitProvider.github,
        token: "new-token",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should throw ZodError for invalid gitProvider", () => {
      const existingSecret = createExistingSecret();

      const input = {
        gitProvider: "invalid-provider",
        sshPrivateKey: "new-key",
        token: "new-token",
      } as any;

      expect(() => editGitServerSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should create data object if it doesn't exist", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
        } as unknown as KubeMetadata,
        type: "Opaque",
      };

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "new-key",
        token: "new-token",
      };

      const result = editGitServerSecret(existingSecret, input);

      expect(result.data).toBeDefined();
      expect(result.data?.id_rsa).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });
  });

  describe("SSH key handling", () => {
    it("should trim and add newline to SSH private key", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {},
      };

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "  key-with-spaces  ",
        token: "test-token",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedKey = Buffer.from(result.data?.id_rsa as string, "base64").toString("utf-8");
      expect(decodedKey).toBe("key-with-spaces\n");
    });

    it("should handle unicode characters in tokens", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {},
      };

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "test-key",
        token: "token-with-unicode-日本語",
      };

      const result = editGitServerSecret(existingSecret, input);

      const decodedToken = Buffer.from(result.data?.token as string, "base64").toString("utf-8");
      expect(decodedToken).toBe("token-with-unicode-日本語");
    });
  });

  describe("immutability", () => {
    it("should not modify the original secret object", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {
          id_rsa: Buffer.from("original-key\n", "utf-8").toString("base64"),
          token: Buffer.from("original-token", "utf-8").toString("base64"),
        },
      };

      const originalIdRsa = existingSecret.data?.id_rsa;
      const originalToken = existingSecret.data?.token;

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "modified-key",
        token: "modified-token",
      };

      editGitServerSecret(existingSecret, input);

      expect(existingSecret.data?.id_rsa).toBe(originalIdRsa);
      expect(existingSecret.data?.token).toBe(originalToken);
    });
  });

  describe("metadata preservation", () => {
    it("should preserve all metadata fields", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
          namespace: "production",
          labels: {
            [SECRET_LABEL_SECRET_TYPE]: "repository",
            "custom-label": "custom-value",
          },
          annotations: {
            "annotation-1": "value-1",
          },
          resourceVersion: "12345",
          uid: "test-uid-123",
          creationTimestamp: "2024-01-01T00:00:00Z",
        },
        type: "Opaque",
        data: {
          id_rsa: Buffer.from("old-key\n", "utf-8").toString("base64"),
          token: Buffer.from("old-token", "utf-8").toString("base64"),
        },
      };

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "new-key",
        token: "new-token",
      };

      const result = editGitServerSecret(existingSecret, input);

      expect(result.metadata).toEqual(existingSecret.metadata);
      expect(result.metadata.resourceVersion).toBe("12345");
      expect(result.metadata.uid).toBe("test-uid-123");
    });
  });
});
