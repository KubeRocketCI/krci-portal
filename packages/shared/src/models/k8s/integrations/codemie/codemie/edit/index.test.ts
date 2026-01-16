import { describe, it, expect } from "vitest";
import { editCodemie } from "./index.js";
import { Codemie, k8sCodemieConfig } from "../../../../groups/KRCI/index.js";
import { ZodError } from "zod";
import { KubeMetadata } from "../../../../common/types.js";

describe("editCodemie", () => {
  const createExistingCodemie = (): Codemie => ({
    apiVersion: k8sCodemieConfig.apiVersion,
    kind: k8sCodemieConfig.kind,
    metadata: {
      name: "test-codemie",
      namespace: "default",
      resourceVersion: "12345",
    } as unknown as KubeMetadata,
    spec: {
      oidc: {
        secretRef: {
          name: "test-codemie",
          clientKey: "client_id",
          secretKey: "client_secret",
        },
        tokenEndpoint: "https://old-auth.example.com/token",
      },
      url: "https://old-api.example.com",
    },
  });

  it("should update tokenEndpoint and apiUrl while preserving other fields", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "https://new-auth.example.com/token",
      apiUrl: "https://new-api.example.com",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec.oidc.tokenEndpoint).toBe("https://new-auth.example.com/token");
    expect(result.spec.url).toBe("https://new-api.example.com");

    // Verify metadata is preserved
    expect(result.metadata.name).toBe("test-codemie");
    expect(result.metadata.namespace).toBe("default");
    expect(result.metadata.resourceVersion).toBe("12345");

    // Verify secretRef is preserved
    expect(result.spec.oidc.secretRef).toEqual({
      name: "test-codemie",
      clientKey: "client_id",
      secretKey: "client_secret",
    });

    // Verify immutability - original should not be modified
    expect(existingCodemie.spec.oidc.tokenEndpoint).toBe("https://old-auth.example.com/token");
    expect(existingCodemie.spec.url).toBe("https://old-api.example.com");
  });

  it("should throw ZodError when tokenEndpoint is missing", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      apiUrl: "https://new-api.example.com",
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is missing", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "https://new-auth.example.com/token",
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should throw ZodError when both fields are missing", () => {
    const existingCodemie = createExistingCodemie();

    const input = {} as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should throw ZodError when tokenEndpoint is not a string", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: 123,
      apiUrl: "https://new-api.example.com",
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is not a string", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "https://new-auth.example.com/token",
      apiUrl: 456,
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should handle minimal URLs", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "http://localhost/token",
      apiUrl: "http://localhost",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec.oidc.tokenEndpoint).toBe("http://localhost/token");
    expect(result.spec.url).toBe("http://localhost");
  });

  it("should create spec object if it doesn't exist", () => {
    const existingCodemie: Codemie = {
      apiVersion: k8sCodemieConfig.apiVersion,
      kind: k8sCodemieConfig.kind,
      metadata: {
        name: "test-codemie",
      },
    } as any;

    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec).toBeDefined();
    expect(result.spec.oidc.tokenEndpoint).toBe("https://auth.example.com/token");
    expect(result.spec.url).toBe("https://api.example.com");
  });

  it("should create oidc object if it doesn't exist", () => {
    const existingCodemie: Codemie = {
      apiVersion: k8sCodemieConfig.apiVersion,
      kind: k8sCodemieConfig.kind,
      metadata: {
        name: "test-codemie",
      } as unknown as KubeMetadata,
      spec: {
        url: "https://old-api.example.com",
      } as any,
    };

    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec.oidc).toBeDefined();
    expect(result.spec.oidc.tokenEndpoint).toBe("https://auth.example.com/token");
  });

  it("should handle special characters in URLs", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "https://auth.example.com:8443/token?client=test&scope=openid",
      apiUrl: "https://api.example.com:9000/v1/codemie?key=value",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec.oidc.tokenEndpoint).toBe("https://auth.example.com:8443/token?client=test&scope=openid");
    expect(result.spec.url).toBe("https://api.example.com:9000/v1/codemie?key=value");
  });

  it("should not modify the original Codemie object", () => {
    const existingCodemie = createExistingCodemie();
    const originalTokenEndpoint = existingCodemie.spec.oidc.tokenEndpoint;
    const originalUrl = existingCodemie.spec.url;

    const input = {
      tokenEndpoint: "https://modified-auth.example.com/token",
      apiUrl: "https://modified-api.example.com",
    };

    editCodemie(existingCodemie, input);

    // Verify original is unchanged
    expect(existingCodemie.spec.oidc.tokenEndpoint).toBe(originalTokenEndpoint);
    expect(existingCodemie.spec.url).toBe(originalUrl);
  });

  it("should throw ZodError when tokenEndpoint is null", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: null,
      apiUrl: "https://api.example.com",
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should throw ZodError when apiUrl is null", () => {
    const existingCodemie = createExistingCodemie();

    const input = {
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: null,
    } as any;

    expect(() => editCodemie(existingCodemie, input)).toThrow(ZodError);
  });

  it("should preserve metadata without modifications", () => {
    const existingCodemie: Codemie = {
      apiVersion: k8sCodemieConfig.apiVersion,
      kind: k8sCodemieConfig.kind,
      metadata: {
        name: "test-codemie",
        namespace: "production",
        labels: {
          "app.kubernetes.io/name": "codemie",
          "custom-label": "custom-value",
        },
        annotations: {
          "annotation-1": "value-1",
        },
        resourceVersion: "54321",
        uid: "test-uid-456",
        creationTimestamp: "2024-01-01T00:00:00Z",
      },
      spec: {
        oidc: {
          secretRef: {
            name: "test-codemie",
            clientKey: "client_id",
            secretKey: "client_secret",
          },
          tokenEndpoint: "https://old-auth.example.com/token",
        },
        url: "https://old-api.example.com",
      },
    };

    const input = {
      tokenEndpoint: "https://new-auth.example.com/token",
      apiUrl: "https://new-api.example.com",
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.metadata).toEqual(existingCodemie.metadata);
    expect(result.metadata.resourceVersion).toBe("54321");
    expect(result.metadata.uid).toBe("test-uid-456");
  });

  it("should handle very long URLs", () => {
    const existingCodemie = createExistingCodemie();
    const longPath = "/path".repeat(100);

    const input = {
      tokenEndpoint: `https://auth.example.com${longPath}/token`,
      apiUrl: `https://api.example.com${longPath}`,
    };

    const result = editCodemie(existingCodemie, input);

    expect(result.spec.oidc.tokenEndpoint).toBe(`https://auth.example.com${longPath}/token`);
    expect(result.spec.url).toBe(`https://api.example.com${longPath}`);
  });
});
