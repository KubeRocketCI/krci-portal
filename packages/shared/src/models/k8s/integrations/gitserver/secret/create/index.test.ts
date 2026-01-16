import { describe, it, expect } from "vitest";
import { createGitServerSecretDraft, createGitServerSecretName } from "./index.js";
import { ZodError } from "zod";
import { gitProvider } from "../../../../groups/KRCI/index.js";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";

describe("createGitServerSecretDraft", () => {
  describe("GitHub provider", () => {
    it("should create a valid GitHub secret draft", () => {
      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----",
        token: "ghp_test_token_123",
      };

      const result = createGitServerSecretDraft(input);

      expect(result).toMatchObject({
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "ci-github",
          labels: {
            [SECRET_LABEL_SECRET_TYPE]: "repository",
          },
        },
      });

      expect(result.data?.id_rsa).toBeDefined();
      expect(result.data?.token).toBeDefined();
      expect(result.data?.username).toBeDefined();
    });

    it("should throw ZodError when token is missing for GitHub", () => {
      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "test-key",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });
  });

  describe("GitLab provider", () => {
    it("should create a valid GitLab secret draft", () => {
      const input = {
        gitProvider: gitProvider.gitlab,
        sshPrivateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----",
        token: "glpat-test_token_123",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.metadata.name).toBe("ci-gitlab");
      expect(result.data?.id_rsa).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });

    it("should throw ZodError when token is missing for GitLab", () => {
      const input = {
        gitProvider: gitProvider.gitlab,
        sshPrivateKey: "test-key",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });
  });

  describe("Bitbucket provider", () => {
    it("should create a valid Bitbucket secret draft", () => {
      const input = {
        gitProvider: gitProvider.bitbucket,
        sshPrivateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----",
        token: "bitbucket_test_token",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.metadata.name).toBe("ci-bitbucket");
      expect(result.data?.id_rsa).toBeDefined();
      expect(result.data?.token).toBeDefined();
    });

    it("should throw ZodError when token is missing for Bitbucket", () => {
      const input = {
        gitProvider: gitProvider.bitbucket,
        sshPrivateKey: "test-key",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });
  });

  describe("Gerrit provider", () => {
    it("should create a valid Gerrit secret draft", () => {
      const input = {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "-----BEGIN RSA PRIVATE KEY-----\ntest-key\n-----END RSA PRIVATE KEY-----",
        sshPublicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.metadata.name).toBe("gerrit-ciuser-sshkey");
      expect(result.data?.id_rsa).toBeDefined();
      expect(result.data?.["id_rsa.pub"]).toBeDefined();
      expect(result.data?.username).toBeDefined();
    });

    it("should throw ZodError when sshPublicKey is missing for Gerrit", () => {
      const input = {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "test-key",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });

    it("should not require token for Gerrit", () => {
      const input = {
        gitProvider: gitProvider.gerrit,
        sshPrivateKey: "test-key",
        sshPublicKey: "test-public-key",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.data?.token).toBeUndefined();
    });
  });

  describe("validation", () => {
    it("should throw ZodError when gitProvider is missing", () => {
      const input = {
        sshPrivateKey: "test-key",
        token: "test-token",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });

    it("should throw ZodError when sshPrivateKey is missing", () => {
      const input = {
        gitProvider: gitProvider.github,
        token: "test-token",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });

    it("should throw ZodError for invalid gitProvider", () => {
      const input = {
        gitProvider: "invalid-provider",
        sshPrivateKey: "test-key",
        token: "test-token",
      } as any;

      expect(() => createGitServerSecretDraft(input)).toThrow(ZodError);
    });

    it("should handle empty strings for token", () => {
      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "test-key",
        token: "",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.data?.token).toBe("");
    });
  });

  describe("createGitServerSecretName", () => {
    it("should return gerrit-ciuser-sshkey for gerrit provider", () => {
      expect(createGitServerSecretName(gitProvider.gerrit)).toBe("gerrit-ciuser-sshkey");
    });

    it("should return ci-github for github provider", () => {
      expect(createGitServerSecretName(gitProvider.github)).toBe("ci-github");
    });

    it("should return ci-gitlab for gitlab provider", () => {
      expect(createGitServerSecretName(gitProvider.gitlab)).toBe("ci-gitlab");
    });

    it("should return ci-bitbucket for bitbucket provider", () => {
      expect(createGitServerSecretName(gitProvider.bitbucket)).toBe("ci-bitbucket");
    });
  });

  describe("SSH key handling", () => {
    it("should trim and add newline to SSH private key", () => {
      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "test-key-with-spaces  ",
        token: "test-token",
      };

      const result = createGitServerSecretDraft(input);

      const decodedKey = Buffer.from(result.data?.id_rsa as string, "base64").toString("utf-8");
      expect(decodedKey).toBe("test-key-with-spaces\n");
    });

    it("should handle multiline SSH keys", () => {
      const sshKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890
test-key-content
-----END RSA PRIVATE KEY-----`;

      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: sshKey,
        token: "test-token",
      };

      const result = createGitServerSecretDraft(input);

      expect(result.data?.id_rsa).toBeDefined();
    });

    it("should handle unicode characters in tokens", () => {
      const input = {
        gitProvider: gitProvider.github,
        sshPrivateKey: "test-key",
        token: "token-with-unicode-日本語",
      };

      const result = createGitServerSecretDraft(input);

      const decodedToken = Buffer.from(result.data?.token as string, "base64").toString("utf-8");
      expect(decodedToken).toBe("token-with-unicode-日本語");
    });
  });
});
