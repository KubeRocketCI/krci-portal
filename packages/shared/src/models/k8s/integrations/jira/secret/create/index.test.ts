import { describe, it, expect } from "vitest";
import { createJiraIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import {
  integrationSecretName,
  SECRET_LABEL_SECRET_TYPE,
  SECRET_LABEL_INTEGRATION_SECRET,
} from "../../../constants.js";

describe("createJiraIntegrationSecretDraft", () => {
  it("should create a valid Jira integration secret draft", () => {
    const input = {
      username: "jira-admin",
      password: "jira-password-123",
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.JIRA,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "jira",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    expect(result.data?.username).toBeDefined();
    expect(result.data?.password).toBeDefined();
    expect(typeof result.data?.username).toBe("string");
    expect(typeof result.data?.password).toBe("string");

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("jira-admin");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("jira-password-123");
  });

  it("should throw ZodError when username is missing", () => {
    const input = {
      password: "jira-password-123",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is missing", () => {
    const input = {
      username: "jira-admin",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const input = {} as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is not a string", () => {
    const input = {
      username: 123,
      password: "jira-password-123",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is not a string", () => {
    const input = {
      username: "jira-admin",
      password: 456,
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      username: "",
      password: "",
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(result.data?.username).toBe("");
    expect(result.data?.password).toBe("");
  });

  it("should handle special characters in username and password", () => {
    const input = {
      username: "user-with-special!@#$%",
      password: "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-with-special!@#$%");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe(
      "password!@#$%^&*()_+-=[]{}|;:',.<>?/~`"
    );
  });

  it("should handle unicode characters in username and password", () => {
    const input = {
      username: "user-日本語-汉字",
      password: "пароль-123",
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("user-日本語-汉字");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("пароль-123");
  });

  it("should handle very long username and password", () => {
    const input = {
      username: "a".repeat(1000),
      password: "b".repeat(1000),
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("a".repeat(1000));
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe("b".repeat(1000));
  });

  it("should handle whitespace in username and password", () => {
    const input = {
      username: "  user with spaces  ",
      password: "password\twith\ttabs\nand\nnewlines",
    };

    const result = createJiraIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.username as string, "base64").toString("utf-8")).toBe("  user with spaces  ");
    expect(Buffer.from(result.data?.password as string, "base64").toString("utf-8")).toBe(
      "password\twith\ttabs\nand\nnewlines"
    );
  });

  it("should throw ZodError when username is null", () => {
    const input = {
      username: null,
      password: "jira-password",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is null", () => {
    const input = {
      username: "jira-admin",
      password: null,
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is undefined", () => {
    const input = {
      username: undefined,
      password: "jira-password",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is undefined", () => {
    const input = {
      username: "jira-admin",
      password: undefined,
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when input is an array", () => {
    const input = ["jira-admin", "jira-password"] as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is a boolean", () => {
    const input = {
      username: true,
      password: "jira-password",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is a boolean", () => {
    const input = {
      username: "jira-admin",
      password: false,
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when username is an object", () => {
    const input = {
      username: { value: "jira-admin" },
      password: "jira-password",
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when password is an object", () => {
    const input = {
      username: "jira-admin",
      password: { value: "jira-password" },
    } as any;

    expect(() => createJiraIntegrationSecretDraft(input)).toThrow(ZodError);
  });
});
