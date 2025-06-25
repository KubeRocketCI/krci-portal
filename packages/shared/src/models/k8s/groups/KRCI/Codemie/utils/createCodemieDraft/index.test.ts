import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { k8sCodemieConfig } from "../../constants";
import { createCodemieDraft } from ".";

describe("K8sCodemie: createCodemieDraft", () => {
  it("should return a valid CodemieDraft object", () => {
    const result = createCodemieDraft({
      name: "my-codemie",
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
    });

    expect(result).toEqual({
      apiVersion: k8sCodemieConfig.apiVersion,
      kind: k8sCodemieConfig.kind,
      metadata: {
        name: "my-codemie",
      },
      spec: {
        oidc: {
          secretRef: {
            name: "my-codemie",
            clientKey: "client_id",
            secretKey: "client_secret",
          },
          tokenEndpoint: "https://auth.example.com/token",
        },
        url: "https://api.example.com",
      },
    });
  });

  it("should correctly set the metadata name", () => {
    const name = "test-codemie";
    const result = createCodemieDraft({
      name,
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
    });

    expect(result.metadata.name).toBe(name);
  });

  it("should correctly set the secret reference name to match the codemie name", () => {
    const name = "demo-codemie";
    const result = createCodemieDraft({
      name,
      tokenEndpoint: "https://auth.example.com/token",
      apiUrl: "https://api.example.com",
    });

    expect(result.spec.oidc.secretRef.name).toBe(name);
  });

  it("should correctly set the token endpoint and API URL", () => {
    const tokenEndpoint = "https://custom-auth.example.org/oauth2/token";
    const apiUrl = "https://custom-api.example.org/v1";

    const result = createCodemieDraft({
      name: "custom-codemie",
      tokenEndpoint,
      apiUrl,
    });

    expect(result.spec.oidc.tokenEndpoint).toBe(tokenEndpoint);
    expect(result.spec.url).toBe(apiUrl);
  });

  it("should throw a ZodError if the draft is invalid", () => {
    // Creating an intentionally invalid input by passing empty strings
    expect(() =>
      createCodemieDraft({
        name: "",
        tokenEndpoint: "",
        apiUrl: "",
      })
    ).toThrow(ZodError);
  });
});
