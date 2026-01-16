import { describe, it, expect } from "vitest";
import { editDependencyTrackIntegrationSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { integrationSecretName, SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_INTEGRATION_SECRET } from "../../constants.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editDependencyTrackIntegrationSecret", () => {
  const createExistingSecret = (): Secret => ({
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: integrationSecretName.DEPENDENCY_TRACK,
      namespace: "default",
      labels: {
        [SECRET_LABEL_SECRET_TYPE]: "dependency-track",
        [SECRET_LABEL_INTEGRATION_SECRET]: "true",
      },
      annotations: {
        "some-annotation": "some-value",
      },
    } as unknown as KubeMetadata,
    type: "Opaque",
    data: {
      token: btoa("old-token"),
      url: btoa("https://old-dependencytrack.example.com"),
      extraField: btoa("should-be-preserved"),
    },
  });

  it("should update token and url while preserving other fields", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
      url: "https://new-dependencytrack.example.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    // Verify updated data
    expect(atob(result.data?.token as string)).toBe("new-token-456");
    expect(atob(result.data?.url as string)).toBe("https://new-dependencytrack.example.com");

    // Verify other data fields are preserved
    expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

    // Verify metadata is preserved
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.labels).toEqual({
      [SECRET_LABEL_SECRET_TYPE]: "dependency-track",
      [SECRET_LABEL_INTEGRATION_SECRET]: "true",
    });
    expect(result.metadata.annotations).toEqual({
      "some-annotation": "some-value",
    });

    // Verify immutability - original should not be modified
    expect(atob(existingSecret.data?.token as string)).toBe("old-token");
    expect(atob(existingSecret.data?.url as string)).toBe("https://old-dependencytrack.example.com");
  });

  it("should throw ZodError when token is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      url: "https://new-dependencytrack.example.com",
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is missing", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: 123,
      url: "https://new-dependencytrack.example.com",
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is not a string", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token-456",
      url: 789,
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle empty strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "",
      url: "",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(result.data?.token).toBe("");
    expect(result.data?.url).toBe("");
  });

  it("should create data object if it doesn't exist", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.DEPENDENCY_TRACK,
      } as unknown as KubeMetadata,
      type: "Opaque",
    };

    const input = {
      token: "new-token",
      url: "https://dependencytrack.example.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(result.data).toBeDefined();
    expect(atob(result.data?.token as string)).toBe("new-token");
    expect(atob(result.data?.url as string)).toBe("https://dependencytrack.example.com");
  });

  it("should handle special characters in token and url", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "token-with-special!@#$%",
      url: "https://dependencytrack.example.com:9090/api?key=value&other=data",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.token as string)).toBe("token-with-special!@#$%");
    expect(atob(result.data?.url as string)).toBe("https://dependencytrack.example.com:9090/api?key=value&other=data");
  });

  it("should verify immutability - original secret is not modified", () => {
    const existingSecret = createExistingSecret();
    const originalToken = existingSecret.data?.token;
    const originalUrl = existingSecret.data?.url;

    const input = {
      token: "completely-new-token",
      url: "https://completely-new-url.com",
    };

    editDependencyTrackIntegrationSecret(existingSecret, input);

    // Original secret should remain unchanged
    expect(existingSecret.data?.token).toBe(originalToken);
    expect(existingSecret.data?.url).toBe(originalUrl);
    expect(atob(existingSecret.data?.token as string)).toBe("old-token");
  });

  it("should preserve all metadata when updating", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token",
      url: "https://new-url.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(result.apiVersion).toBe("v1");
    expect(result.kind).toBe("Secret");
    expect(result.type).toBe("Opaque");
    expect(result.metadata.name).toBe(integrationSecretName.DEPENDENCY_TRACK);
  });

  it("should handle UUID tokens", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      url: "https://dependencytrack.example.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.token as string)).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("should handle long API tokens", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "x".repeat(512),
      url: "https://dependencytrack.example.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.token as string)).toBe("x".repeat(512));
  });

  it("should handle URLs with authentication", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "test-token",
      url: "https://admin:password@dependencytrack.example.com:8443",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.url as string)).toBe("https://admin:password@dependencytrack.example.com:8443");
  });

  it("should handle complex URLs with paths, ports, and query strings", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "test-token",
      url: "https://dependencytrack.example.com:8080/api/v1/path?param1=value1&param2=value2#fragment",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(atob(result.data?.url as string)).toBe(
      "https://dependencytrack.example.com:8080/api/v1/path?param1=value1&param2=value2#fragment"
    );
  });

  it("should throw ZodError when both fields are missing", () => {
    const existingSecret = createExistingSecret();

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, {} as any)).toThrow(ZodError);
  });

  it("should throw ZodError when token is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: null,
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is null", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "test-token",
      url: null,
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when token is an object", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: { value: "test" },
      url: "https://dependencytrack.example.com",
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should throw ZodError when url is an array", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "test-token",
      url: ["https://dependencytrack.example.com"],
    } as any;

    expect(() => editDependencyTrackIntegrationSecret(existingSecret, input)).toThrow(ZodError);
  });

  it("should handle Unicode characters in token", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "token-with-unicode-€£¥",
      url: "https://dependencytrack.example.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(Buffer.from(result.data?.token as string, "base64").toString("utf-8")).toBe("token-with-unicode-€£¥");
  });

  it("should preserve existing data fields that are not being updated", () => {
    const existingSecret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: integrationSecretName.DEPENDENCY_TRACK,
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        token: btoa("old-token"),
        url: btoa("old-url"),
        customField1: btoa("custom-value-1"),
        customField2: btoa("custom-value-2"),
        customField3: btoa("custom-value-3"),
      },
    };

    const input = {
      token: "new-token",
      url: "https://new-url.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    expect(result.data?.customField1).toBe(btoa("custom-value-1"));
    expect(result.data?.customField2).toBe(btoa("custom-value-2"));
    expect(result.data?.customField3).toBe(btoa("custom-value-3"));
  });

  it("should ignore extra properties in input", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "new-token",
      url: "https://new-url.com",
      extraProperty: "should-be-ignored",
      anotherExtra: 123,
    } as any;

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    // Should not throw and should only update token and url
    expect(atob(result.data?.token as string)).toBe("new-token");
    expect(atob(result.data?.url as string)).toBe("https://new-url.com");
    expect(result.data).not.toHaveProperty("extraProperty");
    expect(result.data).not.toHaveProperty("anotherExtra");
  });

  it("should maintain type safety and structure after edit", () => {
    const existingSecret = createExistingSecret();

    const input = {
      token: "validated-token",
      url: "https://validated-url.com",
    };

    const result = editDependencyTrackIntegrationSecret(existingSecret, input);

    // Verify the result conforms to Secret type
    expect(result).toHaveProperty("apiVersion");
    expect(result).toHaveProperty("kind");
    expect(result).toHaveProperty("metadata");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("data");
    expect(result.kind).toBe("Secret");
  });
});
