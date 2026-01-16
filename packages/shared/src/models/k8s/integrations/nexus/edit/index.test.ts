import { describe, it, expect } from "vitest";
import { editNexusIntegrationSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editNexusIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.NEXUS,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "nexus",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      username: btoa("old-user"),
      password: btoa("old-password"),
      url: btoa("https://old-nexus.example.com"),
      extraField: btoa("should-be-preserved"),
    },
  });

  it("should update username, password, and url while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-user",
      password: "new-password-456",
      url: "https://new-nexus.example.com",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    // Verify updated data
    expect(atob(result.data?.username as string)).toBe("new-user");
    expect(atob(result.data?.password as string)).toBe("new-password-456");
    expect(atob(result.data?.url as string)).toBe("https://new-nexus.example.com");

    // Verify other data fields are preserved
    expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

    // Verify metadata is preserved
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "nexus",
      [SECRET_LABEL_INTEGRATION_SECRET]: "true",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    // Verify immutability - original should not be modified
    expect(atob(existingSecret.data?.username as string)).toBe("old-user");
    expect(atob(existingSecret.data?.password as string)).toBe("old-password");
    expect(atob(existingSecret.data?.url as string)).toBe("https://old-nexus.example.com");
  });

  it("should throw ZodError when username is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      password: "new-password-456",
      url: "https://new-nexus.example.com",
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-user",
      url: "https://new-nexus.example.com",
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-user",
      password: "new-password-456",
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when all fields are missing", () => {
    const existingSecret = createExistingSecret();

    const input = {} as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: 123,
      password: "new-password-456",
      url: "https://new-nexus.example.com",
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-user",
      password: 456,
      url: "https://new-nexus.example.com",
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "new-user",
      password: "new-password-456",
      url: 789,
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when multiple fields are not strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: null,
      password: true,
      url: [],
    } as any;

    expect(() => editNexusIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "",
      password: "",
      url: "",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.NEXUS,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      username: "new-user",
      password: "new-password",
      url: "https://nexus.example.com",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(atob(result.data?.username as string)).toBe("new-user");
    expect(atob(result.data?.password as string)).toBe("new-password");
    expect(atob(result.data?.url as string)).toBe("https://nexus.example.com");
  });

  it("should handle special characters in username", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user.name+admin@domain.com",
      password: "password",
      url: "https://nexus.example.com",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("user.name+admin@domain.com");
  });

  it("should handle special characters in password", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user",
      password: "P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?/~`",
      url: "https://nexus.example.com",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.password as string)).toBe("P@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?/~`");
  });

  it("should handle special characters in url", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "user",
      password: "password",
      url: "https://nexus.example.com:8443/service/rest/v1/repositories?format=maven2&type=hosted",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.url as string)).toBe(
      "https://nexus.example.com:8443/service/rest/v1/repositories?format=maven2&type=hosted"
    );
  });

  it("should handle special characters in all fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "admin@nexus.local",
      password: "C0mpl3x!P@ssw0rd#2024",
      url: "https://nexus.example.com:9090/api?key=value&token=abc123",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe("admin@nexus.local");
    expect(atob(result.data?.password as string)).toBe("C0mpl3x!P@ssw0rd#2024");
    expect(atob(result.data?.url as string)).toBe("https://nexus.example.com:9090/api?key=value&token=abc123");
  });

  it("should handle unicode characters", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "用户",
      password: "密码",
      url: "https://nexus.example.com/路径/仓库",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("用户");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("密码");
    expect(Buffer.from(result.data?.url as string, "base64").toString("utf-8")).toBe(
      "https://nexus.example.com/路径/仓库"
    );
  });

  it("should handle very long strings", () => {
    const existingSecret = createExistingSecret();

    const longUsername = "user".repeat(100);
    const longPassword = "pass".repeat(100);
    const longUrl = "https://nexus.example.com/" + "repository/".repeat(50);

    const input = {
      username: longUsername,
      password: longPassword,
      url: longUrl,
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.username as string)).toBe(longUsername);
    expect(atob(result.data?.password as string)).toBe(longPassword);
    expect(atob(result.data?.url as string)).toBe(longUrl);
  });

  it("should update only specified fields and keep existing encoding", () => {
    const existingSecret = createExistingSecret();

    const input = {
      username: "updated-user",
      password: "updated-password",
      url: "https://updated-nexus.example.com",
    };

    const result = editNexusIntegrationSecret(existingSecret, input);

    // Check that new values are properly encoded
    expect(typeof result.data?.username).toBe("string");
    expect(typeof result.data?.password).toBe("string");
    expect(typeof result.data?.url).toBe("string");

    // Verify base64 encoding by decoding
    expect(atob(result.data?.username as string)).toBe("updated-user");
    expect(atob(result.data?.password as string)).toBe("updated-password");
    expect(atob(result.data?.url as string)).toBe("https://updated-nexus.example.com");
  });

  it("should preserve immutability when error occurs during validation", () => {
    const existingSecret = createExistingSecret();
    const originalData = { ...existingSecret.data };

    const input = {
      username: 123, // Invalid type
      password: "password",
      url: "https://nexus.example.com",
    } as any;

    try {
      editNexusIntegrationSecret(existingSecret, input);
    } catch (error) {
      // Original secret should not be modified even when validation fails
      expect(existingSecret.data).toEqual(originalData);
    }
  });
});
