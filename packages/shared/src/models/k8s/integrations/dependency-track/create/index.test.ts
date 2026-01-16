import { describe, it, expect } from "vitest";
import { createDependencyTrackIntegrationSecretDraft } from "./index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";

describe("createDependencyTrackIntegrationSecretDraft", () => {
  it("should create a valid Dependency Track integration secret draft", () => {
    const input = {
      token: "test-token-123",
      url: "https://dependencytrack.example.com",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(result).toMatchObject({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.DEPENDENCY_TRACK,
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "dependency-track",
          [SECRET_LABEL_INTEGRATION_SECRET]: "true",
        },
      },
      type: "Opaque",
    });

    // Verify data is base64 encoded
    expect(result.data?.token).toBeDefined();
    expect(result.data?.url).toBeDefined();
    expect(typeof result.data?.token).toBe("string");
    expect(typeof result.data?.url).toBe("string");

    // Decode and verify the values
    expect(atob(result.data?.token as string)).toBe("test-token-123");
    expect(atob(result.data?.url as string)).toBe("https://dependencytrack.example.com");
  });

  it("should throw ZodError when token is missing", () => {
    const input = {
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const input = {
      token: "test-token-123",
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const input = {} as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const input = {
      token: 123,
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const input = {
      token: "test-token-123",
      url: 456,
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const input = {
      token: "",
      url: "",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(result.data?.token).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should handle special characters in token and url", () => {
    const input = {
      token: "token-with-special-chars!@#$%^&*()",
      url: "https://dependencytrack.example.com:8080/path?query=value",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(atob(result.data?.token as string)).toBe("token-with-special-chars!@#$%^&*()");
    expect(atob(result.data?.url as string)).toBe("https://dependencytrack.example.com:8080/path?query=value");
  });

  it("should handle UUID tokens", () => {
    const input = {
      token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      url: "https://dependencytrack.example.com",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(atob(result.data?.token as string)).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("should handle long API tokens", () => {
    const input = {
      token: "a".repeat(256),
      url: "https://dependencytrack.example.com",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(atob(result.data?.token as string)).toBe("a".repeat(256));
  });

  it("should handle URLs with authentication", () => {
    const input = {
      token: "test-token",
      url: "https://user:pass@dependencytrack.example.com:8443",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(atob(result.data?.url as string)).toBe("https://user:pass@dependencytrack.example.com:8443");
  });

  it("should handle URLs with paths and query parameters", () => {
    const input = {
      token: "test-token",
      url: "https://dependencytrack.example.com/api/v1?param=value&other=data",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(atob(result.data?.url as string)).toBe("https://dependencytrack.example.com/api/v1?param=value&other=data");
  });

  it("should throw ZodError when input is null", () => {
    expect(() => createDependencyTrackIntegrationSecretDraft(null as any)).toThrow(ZodError);
  });

  it("should throw ZodError when input is undefined", () => {
    expect(() => createDependencyTrackIntegrationSecretDraft(undefined as any)).toThrow(ZodError);
  });

  it("should throw ZodError when token is null", () => {
    const input = {
      token: null,
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is null", () => {
    const input = {
      token: "test-token",
      url: null,
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is an object", () => {
    const input = {
      token: { value: "test" },
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is an array", () => {
    const input = {
      token: "test-token",
      url: ["https://dependencytrack.example.com"],
    } as any;

    expect(() => createDependencyTrackIntegrationSecretDraft(input)).toThrow(ZodError);
  });

  it("should handle Unicode characters in token", () => {
    const input = {
      token: "token-with-unicode-€£¥",
      url: "https://dependencytrack.example.com",
    };

    const result = createDependencyTrackIntegrationSecretDraft(input);

    expect(Buffer.from(result.data?.token as string, "base64").toString("utf-8")).toBe("token-with-unicode-€£¥");
  });

  it("should ignore extra properties in input", () => {
    const input = {
      token: "test-token",
      url: "https://dependencytrack.example.com",
      extraProperty: "should-be-ignored",
    } as any;

    const result = createDependencyTrackIntegrationSecretDraft(input);

    // Should not throw and should only include token and url in data
    expect(result.data?.token).toBeDefined();
    expect(result.data?.url).toBeDefined();
    expect(result.data).not.toHaveProperty("extraProperty");
  });
});
