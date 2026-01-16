import { describe, it, expect } from "vitest";
import { createNexusIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";

describe("createNexusIntegrationSecretDraft", () => {
  it("should create a valid Nexus integration secret draft", () => {
    const input = {
      username: "nexus-user",
      password: "nexus-password-123",
      url: "https://nexus.example.com",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.NEXUS,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "nexus",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    // Verify data is base64 encoded
    expect(result.data?.username).toBeDefined();
    expect(result.data?.password).toBeDefined();
    expect(result.data?.url).toBeDefined();
    expect(typeof result.data?.username).toBe("string");
    expect(typeof result.data?.password).toBe("string");
    expect(typeof result.data?.url).toBe("string");

    // Decode and verify the values
    expect(atob(result.data?.username as string)).toBe("nexus-user");
    expect(atob(result.data?.password as string)).toBe("nexus-password-123");
    expect(atob(result.data?.url as string)).toBe("https://nexus.example.com");
  });

  it("should throw ZodError when username is missing", () => {
    const input = {
      password: "nexus-password-123",
      url: "https://nexus.example.com",
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const input = {
      username: "nexus-user",
      url: "https://nexus.example.com",
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const input = {
      username: "nexus-user",
      password: "nexus-password-123",
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when all fields are missing", () => {
    const input = {} as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const input = {
      username: 123,
      password: "nexus-password-123",
      url: "https://nexus.example.com",
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const input = {
      username: "nexus-user",
      password: 456,
      url: "https://nexus.example.com",
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const input = {
      username: "nexus-user",
      password: "nexus-password-123",
      url: 789,
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when multiple fields are not strings", () => {
    const input = {
      username: 123,
      password: true,
      url: null,
    } as any;

    expect(() => createNexusIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      username: "",
      password: "",
      url: "",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should handle special characters in username", () => {
    const input = {
      username: "user.name+test@example.com",
      password: "password",
      url: "https://nexus.example.com",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe("user.name+test@example.com");
  });

  it("should handle special characters in password", () => {
    const input = {
      username: "nexus-user",
      password: "p@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?",
      url: "https://nexus.example.com",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(atob(result.data?.password as string)).toBe("p@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?");
  });

  it("should handle special characters in url", () => {
    const input = {
      username: "nexus-user",
      password: "nexus-password-123",
      url: "https://nexus.example.com:8081/repository/maven-public?query=value&other=data",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(atob(result.data?.url as string)).toBe(
      "https://nexus.example.com:8081/repository/maven-public?query=value&other=data"
    );
  });

  it("should handle special characters in all fields", () => {
    const input = {
      username: "user@domain.com",
      password: "complex!P@ssw0rd#2024",
      url: "https://nexus.example.com:9000/path?key=val&other=123",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe("user@domain.com");
    expect(atob(result.data?.password as string)).toBe("complex!P@ssw0rd#2024");
    expect(atob(result.data?.url as string)).toBe("https://nexus.example.com:9000/path?key=val&other=123");
  });

  it("should handle unicode characters", () => {
    const input = {
      username: "用户名",
      password: "密码123",
      url: "https://nexus.example.com/路径",
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("用户名");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("密码123");
    expect(Buffer.from(result.data?.url as string, "base64").toString("utf-8")).toBe("https://nexus.example.com/路径");
  });

  it("should handle very long strings", () => {
    const longUsername = "user".repeat(100);
    const longPassword = "pass".repeat(100);
    const longUrl = "https://nexus.example.com/" + "path/".repeat(100);

    const input = {
      username: longUsername,
      password: longPassword,
      url: longUrl,
    };

    const result = createNexusIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe(longUsername);
    expect(atob(result.data?.password as string)).toBe(longPassword);
    expect(atob(result.data?.url as string)).toBe(longUrl);
  });
});
