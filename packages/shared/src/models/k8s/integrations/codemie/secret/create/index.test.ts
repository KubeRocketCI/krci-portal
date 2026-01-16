import { describe, it, expect } from "vitest";
import { createCodemieSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { SECRET_LABEL_SECRET_TYPE } from "../../../constants.js";

describe("createCodemieSecretDraft", () => {
  it("should create a valid Codemie secret draft", () => {
    const input = {
      name: "test-codemie-secret",
      clientId: "test-client-id-123",
      clientSecret: "test-client-secret-456",
    };

    const result = createCodemieSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-codemie-secret",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "codemie",
        },
      },
      type: "Opaque",
    });

    expect(result.data?.client_id).toBeDefined();
    expect(result.data?.client_secret).toBeDefined();
    expect(typeof result.data?.client_id).toBe("string");
    expect(typeof result.data?.client_secret).toBe("string");

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("test-client-id-123");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe(
      "test-client-secret-456"
    );
  });

  it("should throw ZodError when name is missing", () => {
    const input = {
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientId is missing", () => {
    const input = {
      name: "test-codemie-secret",
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is missing", () => {
    const input = {
      name: "test-codemie-secret",
      clientId: "test-client-id",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when all fields are missing", () => {
    const input = {} as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when name is not a string", () => {
    const input = {
      name: 123,
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientId is not a string", () => {
    const input = {
      name: "test-codemie-secret",
      clientId: 456,
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is not a string", () => {
    const input = {
      name: "test-codemie-secret",
      clientId: "test-client-id",
      clientSecret: 789,
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      name: "",
      clientId: "",
      clientSecret: "",
    };

    const result = createCodemieSecretDraft(input);

    expect(result.metadata.name).toBe("");
    expect(result.data?.client_id).toBe("");
    expect(result.data?.client_secret).toBe("");
  });

  it("should handle special characters in client credentials", () => {
    const input = {
      name: "test-codemie",
      clientId: "client-id-with-special!@#$%",
      clientSecret: "secret-with-special^&*()_+-=[]{}|;:',.<>?/~`",
    };

    const result = createCodemieSecretDraft(input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe(
      "client-id-with-special!@#$%"
    );
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe(
      "secret-with-special^&*()_+-=[]{}|;:',.<>?/~`"
    );
  });

  it("should handle unicode characters", () => {
    const input = {
      name: "test-codemie",
      clientId: "client-日本語-汉字",
      clientSecret: "secret-пароль-123",
    };

    const result = createCodemieSecretDraft(input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("client-日本語-汉字");
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("secret-пароль-123");
  });

  it("should handle very long credentials", () => {
    const input = {
      name: "test-codemie",
      clientId: "client-".repeat(100),
      clientSecret: "secret-".repeat(100),
    };

    const result = createCodemieSecretDraft(input);

    expect(Buffer.from(result.data?.client_id as string, "base64").toString("utf-8")).toBe("client-".repeat(100));
    expect(Buffer.from(result.data?.client_secret as string, "base64").toString("utf-8")).toBe("secret-".repeat(100));
  });

  it("should handle names with hyphens and numbers", () => {
    const input = {
      name: "codemie-secret-123",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    };

    const result = createCodemieSecretDraft(input);

    expect(result.metadata.name).toBe("codemie-secret-123");
  });

  it("should throw ZodError when name is null", () => {
    const input = {
      name: null,
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientId is null", () => {
    const input = {
      name: "test-codemie",
      clientId: null,
      clientSecret: "test-client-secret",
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when clientSecret is null", () => {
    const input = {
      name: "test-codemie",
      clientId: "test-client-id",
      clientSecret: null,
    } as any;

    expect(() => createCodemieSecretDraft(input)).toThrow(ZodError);
  });
});
