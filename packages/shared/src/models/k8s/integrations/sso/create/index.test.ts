import { describe, it, expect } from "vitest";
import { createSSOIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE } from "../../constants.js";

describe("createSSOIntegrationSecretDraft", () => {
  it("should create a valid SSO integration secret draft", () => {
    const input = {
      username: "admin-user",
      password: "secure-password-123",
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.SSO,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "keycloak",
        },
      },
      type: "Opaque",
    });

    // Verify data is base64 encoded
    expect(result.data?.username).toBeDefined();
    expect(result.data?.password).toBeDefined();
    expect(typeof result.data?.username).toBe("string");
    expect(typeof result.data?.password).toBe("string");

    // Decode and verify the values
    expect(atob(result.data?.username as string)).toBe("admin-user");
    expect(atob(result.data?.password as string)).toBe("secure-password-123");
  });

  it("should throw ZodError when username is missing", () => {
    const input = {
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const input = {
      username: "admin-user",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const input = {} as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const input = {
      username: 123,
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const input = {
      username: "admin-user",
      password: 456,
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      username: "",
      password: "",
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
  });

  it("should handle special characters in username and password", () => {
    const input = {
      username: "user-with-special!@#$%^&*()",
      password: "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe("user-with-special!@#$%^&*()");
    expect(atob(result.data?.password as string)).toBe("password!@#$%^&*()_+-=[]{}|;:',.<>?/~`");
  });

  it("should handle unicode characters in username and password", () => {
    const input = {
      username: "user-日本語-汉字",
      password: "пароль-пароль-123",
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-日本語-汉字");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("пароль-пароль-123");
  });

  it("should handle very long username and password", () => {
    const input = {
      username: "a".repeat(1000),
      password: "b".repeat(1000),
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe("a".repeat(1000));
    expect(atob(result.data?.password as string)).toBe("b".repeat(1000));
  });

  it("should handle whitespace in username and password", () => {
    const input = {
      username: "  user with spaces  ",
      password: "password\twith\ttabs\nand\nnewlines",
    };

    const result = createSSOIntegrationSecretDraft(input);

    expect(atob(result.data?.username as string)).toBe("  user with spaces  ");
    expect(atob(result.data?.password as string)).toBe("password\twith\ttabs\nand\nnewlines");
  });

  it("should throw ZodError when username is null", () => {
    const input = {
      username: null,
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is null", () => {
    const input = {
      username: "admin-user",
      password: null,
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is undefined", () => {
    const input = {
      username: undefined,
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is undefined", () => {
    const input = {
      username: "admin-user",
      password: undefined,
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when input is an array", () => {
    const input = ["admin-user", "secure-password-123"] as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is a boolean", () => {
    const input = {
      username: true,
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is a boolean", () => {
    const input = {
      username: "admin-user",
      password: false,
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is an object", () => {
    const input = {
      username: { value: "admin-user" },
      password: "secure-password-123",
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is an object", () => {
    const input = {
      username: "admin-user",
      password: { value: "secure-password-123" },
    } as any;

    expect(() => createSSOIntegrationSecretDraft(input)).toThrow(ZodError);
  });
});
