import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertCanonicalResourceConfig } from "./index.js";

const CANONICAL = {
  Deployment: { group: "apps", version: "v1", pluralName: "deployments" },
  ReplicationController: { group: "", version: "v1", pluralName: "replicationcontrollers" },
} as const;

describe("assertCanonicalResourceConfig", () => {
  it("passes when group/version/pluralName match the canonical entry for the kind", () => {
    expect(() =>
      assertCanonicalResourceConfig(
        { kind: "Deployment", group: "apps", version: "v1", pluralName: "deployments" },
        CANONICAL
      )
    ).not.toThrow();
  });

  it("passes for a core-group kind whose canonical group is the empty string", () => {
    expect(() =>
      assertCanonicalResourceConfig(
        { kind: "ReplicationController", group: "", version: "v1", pluralName: "replicationcontrollers" },
        CANONICAL
      )
    ).not.toThrow();
  });

  it.each([
    ["group", { kind: "Deployment", group: "rbac.authorization.k8s.io", version: "v1", pluralName: "deployments" }],
    ["version", { kind: "Deployment", group: "apps", version: "v1beta1", pluralName: "deployments" }],
    ["pluralName", { kind: "Deployment", group: "apps", version: "v1", pluralName: "secrets" }],
  ] as const)("throws BAD_REQUEST when %s does not match the canonical entry", (_field, resourceConfig) => {
    expect(() => assertCanonicalResourceConfig(resourceConfig, CANONICAL)).toThrow(TRPCError);
    expect(() => assertCanonicalResourceConfig(resourceConfig, CANONICAL)).toThrow(
      /does not match the canonical values/
    );
  });
});
