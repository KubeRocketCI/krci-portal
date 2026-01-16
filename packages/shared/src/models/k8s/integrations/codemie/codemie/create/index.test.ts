import { describe, it, expect } from "vitest";
import { createCodemieDraft } from "./index.js";
import { ZodError } from "zod";
import { k8sCodemieConfig } from "../../../../groups/KRCI/index.js";

describe("createCodemieDraft", () => {
  it("should create a valid Codemie draft", () => {
    const input = {
      tokenEndpoint: "https://auth.codemie.example.com/token",
      apiUrl: "https://api.codemie.example.com",
      name: "test-codemie",
    };

    const result = createCodemieDraft(input);

    expect(result).toMatchObject({
      apiVersion: k8sCodemieConfig.apiVersion,
      kind: k8sCodemieConfig.kind,
      metadata: {
        name: "test-codemie",
      },
      spec: {
        oidc: {
          secretRef: {
            name: "test-codemie",
            clientKey: "client_id",
            secretKey: "client_secret",
          },
          tokenEndpoint: "https://auth.codemie.example.com/token",
        },
        url: "https://api.codemie.example.com",
      },
    });
  });

  it("should throw ZodError when tokenEndpoint is missing", () => {
    const input = {
      apiUrl: "https://api.codemie.example.com",
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is missing", () => {
    const input = {
      tokenEndpoint: "https://auth.codemie.example.com/token",
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when name is missing", () => {
    const input = {
      tokenEndpoint: "https://auth.codemie.example.com/token",
      apiUrl: "https://api.codemie.example.com",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when all fields are missing", () => {
    const input = {} as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when tokenEndpoint is not a string", () => {
    const input = {
      tokenEndpoint: 123,
      apiUrl: "https://api.codemie.example.com",
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is not a string", () => {
    const input = {
      tokenEndpoint: "https://auth.codemie.example.com/token",
      apiUrl: 456,
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when name is not a string", () => {
    const input = {
      tokenEndpoint: "https://auth.codemie.example.com/token",
      apiUrl: "https://api.codemie.example.com",
      name: 789,
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should handle empty name", () => {
    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
      name: "",
    };

    const result = createCodemieDraft(input);

    expect(result.metadata.name).toBe("");
  });

  it("should handle special characters in URLs", () => {
    const input = {
      tokenEndpoint: "https://auth.example.com:8443/token?client=test&scope=openid",
      apiUrl: "https://api.example.com:9000/v1/codemie",
      name: "test-codemie-special",
    };

    const result = createCodemieDraft(input);

    expect(result.spec.oidc.tokenEndpoint).toBe("https://auth.example.com:8443/token?client=test&scope=openid");
    expect(result.spec.url).toBe("https://api.example.com:9000/v1/codemie");
  });

  it("should handle names with hyphens and numbers", () => {
    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
      name: "test-codemie-123",
    };

    const result = createCodemieDraft(input);

    expect(result.metadata.name).toBe("test-codemie-123");
    expect(result.spec.oidc.secretRef.name).toBe("test-codemie-123");
  });

  it("should throw ZodError when tokenEndpoint is null", () => {
    const input = {
      tokenEndpoint: null,
      apiUrl: "https://api.example.com",
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is null", () => {
    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: null,
      name: "test-codemie",
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when name is null", () => {
    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
      name: null,
    } as any;

    expect(() => createCodemieDraft(input)).toThrow(ZodError);
  });

  it("should handle very long URLs", () => {
    const longPath = "/path".repeat(100);
    const input = {
      tokenEndpoint: `https://auth.example.com${longPath}/token`,
      apiUrl: `https://api.example.com${longPath}`,
      name: "test-codemie",
    };

    const result = createCodemieDraft(input);

    expect(result.spec.oidc.tokenEndpoint).toBe(`https://auth.example.com${longPath}/token`);
    expect(result.spec.url).toBe(`https://api.example.com${longPath}`);
  });
});
