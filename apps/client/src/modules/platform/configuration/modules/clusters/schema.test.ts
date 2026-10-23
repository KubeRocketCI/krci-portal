import { describe, expect, it } from "vitest";
import { clusterType } from "@my-project/shared";
import { clusterSecretFormSchema } from "./schema";
import { createDefaultValues } from "./components/CreateClusterSecretForm/providers/form/constants";
import type { ManageClusterSecretValues } from "./components/CreateClusterSecretForm/types";

const validBearer: ManageClusterSecretValues = {
  ...createDefaultValues,
  clusterName: "c1",
  clusterHost: "https://c1.example.com",
  clusterToken: "token",
  clusterCertificate: "Y2VydA==",
};

const validIrsa: ManageClusterSecretValues = {
  ...createDefaultValues,
  clusterType: clusterType.irsa,
  clusterName: "c2",
  clusterHost: "https://c2.example.com",
  roleARN: "arn:aws:iam::123456789012:role/cluster-access",
  caData: "Y2E=",
};

function getFieldErrors(values: ManageClusterSecretValues): Partial<Record<keyof ManageClusterSecretValues, string[]>> {
  return clusterSecretFormSchema.safeParse(values).error?.flatten().fieldErrors ?? {};
}

describe("clusterSecretFormSchema", () => {
  describe("Bearer", () => {
    it("accepts a token and a certificate without the IRSA fields", () => {
      expect(getFieldErrors(validBearer)).toEqual({});
    });

    it("accepts a cluster that skips TLS verification without a certificate", () => {
      expect(getFieldErrors({ ...validBearer, skipTLSVerify: true, clusterCertificate: "" })).toEqual({});
    });

    it("requires the token when TLS verification is skipped", () => {
      const values = { ...validBearer, clusterToken: "", skipTLSVerify: true, clusterCertificate: "" };

      expect(getFieldErrors(values)).toEqual({ clusterToken: ["Provide the cluster token."] });
    });

    it.each([
      ["clusterName", "Enter a name for the cluster."],
      ["clusterHost", "Enter the cluster URL assigned to the host."],
      ["clusterToken", "Provide the cluster token."],
      ["clusterCertificate", "Paste the cluster certificate."],
    ] as const)("reports an empty %s", (field, message) => {
      const fieldErrors = getFieldErrors({ ...validBearer, [field]: "" });

      expect(Object.keys(fieldErrors)).toEqual([field]);
      expect(fieldErrors[field]?.[0]).toBe(message);
    });

    it("rejects a host without HTTPS", () => {
      expect(getFieldErrors({ ...validBearer, clusterHost: "http://c1.example.com" })).toEqual({
        clusterHost: ["Enter a valid URL with HTTPS protocol."],
      });
    });

    it("reports every required field of the untouched Add Cluster form", () => {
      expect(Object.keys(getFieldErrors(createDefaultValues)).sort()).toEqual([
        "clusterCertificate",
        "clusterHost",
        "clusterName",
        "clusterToken",
      ]);
    });
  });

  describe("IRSA", () => {
    it("accepts CA data and a role ARN without a token or a certificate", () => {
      expect(getFieldErrors(validIrsa)).toEqual({});
    });

    it.each([
      ["clusterName", "Enter a name for the cluster."],
      ["clusterHost", "Enter the cluster URL assigned to the host."],
      ["caData", "Enter Certificate Authority Data."],
      ["roleARN", "Enter Role ARN."],
    ] as const)("reports an empty %s", (field, message) => {
      const fieldErrors = getFieldErrors({ ...validIrsa, [field]: "" });

      expect(Object.keys(fieldErrors)).toEqual([field]);
      expect(fieldErrors[field]?.[0]).toBe(message);
    });

    it("reports every required field of the untouched Add Cluster form", () => {
      const values = { ...createDefaultValues, clusterType: clusterType.irsa };

      expect(Object.keys(getFieldErrors(values)).sort()).toEqual(["caData", "clusterHost", "clusterName", "roleARN"]);
    });
  });
});
