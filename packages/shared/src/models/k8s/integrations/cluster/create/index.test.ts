import { describe, it, expect } from "vitest";
import { createClusterSecretDraft, clusterType, getClusterName } from "./index.js";
import { ZodError } from "zod";
import { SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_CLUSTER_TYPE } from "../../constants.js";
import { Secret } from "../../../groups/Core/index.js";
import { KubeMetadata } from "../../../common/types.js";

describe("createClusterSecretDraft", () => {
  describe("bearer type", () => {
    it("should create a valid bearer cluster secret with skipTLSVerify", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterHost: "https://api.test-cluster.example.com",
        clusterToken: "test-token-123",
        skipTLSVerify: true,
      };

      const result = createClusterSecretDraft(input);

      expect(result).toMatchObject({
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "test-cluster-cluster",
          labels: {
            [SECRET_LABEL_SECRET_TYPE]: "cluster",
            [SECRET_LABEL_CLUSTER_TYPE]: "bearer",
          },
        },
      });

      // Decode and verify the config
      const config = JSON.parse(atob(result.data?.config as string));
      expect(config).toMatchObject({
        apiVersion: "v1",
        kind: "Config",
        "current-context": "default-context",
        clusters: [
          {
            cluster: {
              server: "https://api.test-cluster.example.com",
              "insecure-skip-tls-verify": true,
            },
            name: "test-cluster",
          },
        ],
        contexts: [
          {
            context: {
              cluster: "test-cluster",
              user: "default-user",
            },
            name: "default-context",
          },
        ],
        users: [
          {
            user: {
              token: "test-token-123",
            },
            name: "default-user",
          },
        ],
      });

      expect(config.clusters[0].cluster["certificate-authority-data"]).toBeUndefined();
    });

    it("should create a valid bearer cluster secret with certificate", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterHost: "https://api.test-cluster.example.com",
        clusterToken: "test-token-123",
        clusterCertificate: "base64-encoded-cert",
        skipTLSVerify: false,
      };

      const result = createClusterSecretDraft(input);

      const config = JSON.parse(atob(result.data?.config as string));
      expect(config.clusters[0].cluster).toMatchObject({
        server: "https://api.test-cluster.example.com",
        "certificate-authority-data": "base64-encoded-cert",
      });
      expect(config.clusters[0].cluster["insecure-skip-tls-verify"]).toBeUndefined();
    });

    it("should ignore certificate when skipTLSVerify is true", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterHost: "https://api.test-cluster.example.com",
        clusterToken: "test-token-123",
        clusterCertificate: "base64-encoded-cert",
        skipTLSVerify: true,
      };

      const result = createClusterSecretDraft(input);

      const config = JSON.parse(atob(result.data?.config as string));
      expect(config.clusters[0].cluster["insecure-skip-tls-verify"]).toBe(true);
      expect(config.clusters[0].cluster["certificate-authority-data"]).toBeUndefined();
    });

    it("should throw ZodError when clusterName is missing", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterHost: "https://api.test-cluster.example.com",
        clusterToken: "test-token-123",
        skipTLSVerify: true,
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });

    it("should throw ZodError when clusterToken is missing", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterHost: "https://api.test-cluster.example.com",
        skipTLSVerify: true,
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });
  });

  describe("irsa type", () => {
    it("should create a valid irsa cluster secret", () => {
      const input = {
        clusterType: clusterType.irsa,
        clusterName: "irsa-cluster",
        clusterHost: "https://api.irsa-cluster.example.com",
        roleARN: "arn:aws:iam::123456789012:role/test-role",
        caData: "base64-ca-data",
      };

      const result = createClusterSecretDraft(input);

      expect(result).toMatchObject({
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "irsa-cluster-cluster",
          labels: {
            [SECRET_LABEL_SECRET_TYPE]: "cluster",
            [SECRET_LABEL_CLUSTER_TYPE]: "irsa",
            "argocd.argoproj.io/secret-type": "cluster",
          },
        },
      });

      // Decode and verify the config
      const config = JSON.parse(atob(result.data?.config as string));
      expect(config).toEqual({
        server: "https://api.irsa-cluster.example.com",
        awsAuthConfig: {
          clusterName: "irsa-cluster",
          roleARN: "arn:aws:iam::123456789012:role/test-role",
        },
        tlsClientConfig: {
          insecure: false,
          caData: "base64-ca-data",
        },
      });

      // Verify other data fields
      expect(atob(result.data?.name as string)).toBe("irsa-cluster");
      expect(atob(result.data?.server as string)).toBe("https://api.irsa-cluster.example.com");
    });

    it("should throw ZodError when roleARN is missing", () => {
      const input = {
        clusterType: clusterType.irsa,
        clusterName: "irsa-cluster",
        clusterHost: "https://api.irsa-cluster.example.com",
        caData: "base64-ca-data",
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });

    it("should throw ZodError when caData is missing", () => {
      const input = {
        clusterType: clusterType.irsa,
        clusterName: "irsa-cluster",
        clusterHost: "https://api.irsa-cluster.example.com",
        roleARN: "arn:aws:iam::123456789012:role/test-role",
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });
  });

  describe("validation", () => {
    it("should throw ZodError for invalid clusterType", () => {
      const input = {
        clusterType: "invalid",
        clusterName: "test-cluster",
        clusterHost: "https://api.test-cluster.example.com",
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });

    it("should throw ZodError when clusterHost is missing", () => {
      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterToken: "test-token",
        skipTLSVerify: true,
      } as any;

      expect(() => createClusterSecretDraft(input)).toThrow(ZodError);
    });
  });
});

describe("getClusterName", () => {
  it("should extract cluster name from bearer type secret", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster",
        labels: {
          [SECRET_LABEL_CLUSTER_TYPE]: "bearer",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        config: btoa(
          JSON.stringify({
            clusters: [
              {
                name: "my-cluster-name",
                cluster: {
                  server: "https://api.example.com",
                },
              },
            ],
          })
        ),
      },
    };

    const result = getClusterName(secret);
    expect(result).toBe("my-cluster-name");
  });

  it("should extract cluster name from irsa type secret", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster",
        labels: {
          [SECRET_LABEL_CLUSTER_TYPE]: "irsa",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        name: btoa("irsa-cluster-name"),
        server: btoa("https://api.example.com"),
        config: btoa(JSON.stringify({ server: "https://api.example.com" })),
      },
    };

    const result = getClusterName(secret);
    expect(result).toBe("irsa-cluster-name");
  });

  it("should default to bearer type when label is missing", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster",
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        config: btoa(
          JSON.stringify({
            clusters: [
              {
                name: "default-cluster",
                cluster: {
                  server: "https://api.example.com",
                },
              },
            ],
          })
        ),
      },
    };

    const result = getClusterName(secret);
    expect(result).toBe("default-cluster");
  });

  it("should return empty string when config is empty", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster",
        labels: {
          [SECRET_LABEL_CLUSTER_TYPE]: "bearer",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        config: "",
      },
    };

    const result = getClusterName(secret);
    expect(result).toBeUndefined();
  });

  it("should return empty string when name data is missing for irsa type", () => {
    const secret: Secret = {
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "test-cluster",
        labels: {
          [SECRET_LABEL_CLUSTER_TYPE]: "irsa",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {},
    };

    const result = getClusterName(secret);
    expect(result).toBe("");
  });
});
