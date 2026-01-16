import { describe, it, expect } from "vitest";
import { editClusterSecret } from "./index.js";
import { Secret } from "../../../groups/Core/index.js";
import { ZodError } from "zod";
import { SECRET_LABEL_SECRET_TYPE, SECRET_LABEL_CLUSTER_TYPE } from "../../constants.js";
import { clusterType } from "../create/index.js";
import { KubeMetadata } from "../../../common/types.js";

describe("editClusterSecret", () => {
  describe("bearer type", () => {
    const createBearerSecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "old-cluster-cluster",
        namespace: "default",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "cluster",
          [SECRET_LABEL_CLUSTER_TYPE]: "bearer",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        config: btoa(
          JSON.stringify({
            apiVersion: "v1",
            kind: "Config",
            clusters: [{ name: "old-cluster", cluster: { server: "https://old.example.com" } }],
          })
        ),
        extraField: btoa("should-be-preserved"),
      },
    });

    it("should update bearer cluster with skipTLSVerify", () => {
      const existingSecret = createBearerSecret();

      const input = {
        clusterType: clusterType.bearer,
        clusterName: "new-cluster",
        clusterHost: "https://new.example.com",
        clusterToken: "new-token",
        skipTLSVerify: true,
      };

      const result = editClusterSecret(existingSecret, input);

      const config = JSON.parse(atob(result.data?.config as string));
      expect(config).toMatchObject({
        apiVersion: "v1",
        kind: "Config",
        "current-context": "default-context",
        clusters: [
          {
            cluster: {
              server: "https://new.example.com",
              "insecure-skip-tls-verify": true,
            },
            name: "new-cluster",
          },
        ],
        users: [
          {
            user: {
              token: "new-token",
            },
            name: "default-user",
          },
        ],
      });

      // Verify other data fields are preserved
      expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

      // Verify metadata is preserved
      expect(result.metadata.namespace).toBe("default");

      // Verify immutability
      const oldConfig = JSON.parse(atob(existingSecret.data?.config as string));
      expect(oldConfig.clusters[0].name).toBe("old-cluster");
    });

    it("should update bearer cluster with certificate", () => {
      const existingSecret = createBearerSecret();

      const input = {
        clusterType: clusterType.bearer,
        clusterName: "new-cluster",
        clusterHost: "https://new.example.com",
        clusterToken: "new-token",
        clusterCertificate: "base64-cert",
        skipTLSVerify: false,
      };

      const result = editClusterSecret(existingSecret, input);

      const config = JSON.parse(atob(result.data?.config as string));
      expect(config.clusters[0].cluster).toMatchObject({
        server: "https://new.example.com",
        "certificate-authority-data": "base64-cert",
      });
      expect(config.clusters[0].cluster["insecure-skip-tls-verify"]).toBeUndefined();
    });

    it("should throw ZodError when clusterToken is missing", () => {
      const existingSecret = createBearerSecret();

      const input = {
        clusterType: clusterType.bearer,
        clusterName: "new-cluster",
        clusterHost: "https://new.example.com",
        skipTLSVerify: true,
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });
  });

  describe("irsa type", () => {
    const createIRSASecret = (): Secret => ({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "old-irsa-cluster",
        namespace: "default",
        labels: {
          [SECRET_LABEL_SECRET_TYPE]: "cluster",
          [SECRET_LABEL_CLUSTER_TYPE]: "irsa",
        },
      } as unknown as KubeMetadata,
      type: "Opaque",
      data: {
        config: btoa(
          JSON.stringify({
            server: "https://old-irsa.example.com",
            awsAuthConfig: {
              clusterName: "old-irsa",
              roleARN: "arn:aws:iam::111111111111:role/old-role",
            },
          })
        ),
        name: btoa("old-irsa"),
        server: btoa("https://old-irsa.example.com"),
        extraField: btoa("should-be-preserved"),
      },
    });

    it("should update irsa cluster", () => {
      const existingSecret = createIRSASecret();

      const input = {
        clusterType: clusterType.irsa,
        clusterName: "new-irsa",
        clusterHost: "https://new-irsa.example.com",
        roleARN: "arn:aws:iam::222222222222:role/new-role",
        caData: "new-ca-data",
      };

      const result = editClusterSecret(existingSecret, input);

      const config = JSON.parse(atob(result.data?.config as string));
      expect(config).toEqual({
        server: "https://new-irsa.example.com",
        awsAuthConfig: {
          clusterName: "new-irsa",
          roleARN: "arn:aws:iam::222222222222:role/new-role",
        },
        tlsClientConfig: {
          insecure: false,
          caData: "new-ca-data",
        },
      });

      expect(atob(result.data?.name as string)).toBe("new-irsa");
      expect(atob(result.data?.server as string)).toBe("https://new-irsa.example.com");

      // Verify other data fields are preserved
      expect(result.data?.extraField).toBe(btoa("should-be-preserved"));

      // Verify metadata is preserved
      expect(result.metadata.namespace).toBe("default");

      // Verify immutability
      expect(atob(existingSecret.data?.name as string)).toBe("old-irsa");
    });

    it("should throw ZodError when roleARN is missing", () => {
      const existingSecret = createIRSASecret();

      const input = {
        clusterType: clusterType.irsa,
        clusterName: "new-irsa",
        clusterHost: "https://new-irsa.example.com",
        caData: "new-ca-data",
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should throw ZodError when caData is missing", () => {
      const existingSecret = createIRSASecret();

      const input = {
        clusterType: clusterType.irsa,
        clusterName: "new-irsa",
        clusterHost: "https://new-irsa.example.com",
        roleARN: "arn:aws:iam::222222222222:role/new-role",
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });
  });

  describe("validation", () => {
    it("should create data object if it doesn't exist", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "test-cluster",
        } as unknown as KubeMetadata,
        type: "Opaque",
      };

      const input = {
        clusterType: clusterType.bearer,
        clusterName: "new-cluster",
        clusterHost: "https://new.example.com",
        clusterToken: "new-token",
        skipTLSVerify: true,
      };

      const result = editClusterSecret(existingSecret, input);

      expect(result.data).toBeDefined();
      expect(result.data?.config).toBeDefined();
    });

    it("should throw ZodError for invalid clusterType", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "test-cluster",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {},
      };

      const input = {
        clusterType: "invalid",
        clusterName: "test-cluster",
        clusterHost: "https://test.example.com",
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should throw ZodError when clusterName is missing", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "test-cluster",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {},
      };

      const input = {
        clusterType: clusterType.bearer,
        clusterHost: "https://test.example.com",
        clusterToken: "token",
        skipTLSVerify: true,
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });

    it("should throw ZodError when clusterHost is missing", () => {
      const existingSecret: Secret = {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: "test-cluster",
        } as unknown as KubeMetadata,
        type: "Opaque",
        data: {},
      };

      const input = {
        clusterType: clusterType.bearer,
        clusterName: "test-cluster",
        clusterToken: "token",
        skipTLSVerify: true,
      } as any;

      expect(() => editClusterSecret(existingSecret, input)).toThrow(ZodError);
    });
  });
});
