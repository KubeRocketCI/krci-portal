import { describe, expect, test } from "vitest";
import { createCustomResourceURL } from "./index.js";
import type { K8sResourceConfig } from "@my-project/shared";

describe("createCustomResourceURL", () => {
  test("creates URL for core namespaced resource", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "Pod",
      singularName: "pod",
      pluralName: "pods",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    expect(result).toBe("/api/v1/namespaces/default/pods");
  });

  test("creates URL for core cluster-scoped resource", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "Node",
      singularName: "node",
      pluralName: "nodes",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    expect(result).toBe("/api/v1/nodes");
  });

  test("creates URL for custom resource with group", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "apps/v1",
      group: "apps",
      version: "v1",
      kind: "Deployment",
      singularName: "deployment",
      pluralName: "deployments",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "production",
    });

    expect(result).toBe("/apis/apps/v1/namespaces/production/deployments");
  });

  test("creates URL with resource name", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "Pod",
      singularName: "pod",
      pluralName: "pods",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
      name: "my-pod",
    });

    expect(result).toBe("/api/v1/namespaces/default/pods/my-pod");
  });

  test("creates URL with label selector", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "Pod",
      singularName: "pod",
      pluralName: "pods",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
      labels: { app: "my-app", env: "prod" },
    });

    expect(result).toContain("/api/v1/namespaces/default/pods?labelSelector=");
    // Label selector values are URL encoded
    expect(decodeURIComponent(result)).toContain("app=my-app,env=prod");
  });

  test("creates URL with name and label selector", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "apps/v1",
      group: "apps",
      version: "v1",
      kind: "Deployment",
      singularName: "deployment",
      pluralName: "deployments",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
      name: "my-deployment",
      labels: { app: "my-app" },
    });

    expect(result).toContain("/apis/apps/v1/namespaces/default/deployments/my-deployment?labelSelector=");
  });

  test("handles empty group for custom resource", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "CustomResource",
      singularName: "customresource",
      pluralName: "customresources",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    // Empty group means core API, which uses /api not /apis
    expect(result).toBe("/api/v1/namespaces/default/customresources");
  });

  test("uses apiVersion when version is not provided", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "apps/v1",
      group: "apps",
      version: "v1",
      kind: "Deployment",
      singularName: "deployment",
      pluralName: "deployments",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    expect(result).toBe("/apis/apps/v1/namespaces/default/deployments");
  });

  test("handles Namespace kind correctly", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "Namespace",
      singularName: "namespace",
      pluralName: "namespaces",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    expect(result).toBe("/api/v1/namespaces");
  });

  test("handles PersistentVolume (cluster-scoped)", () => {
    const resourceConfig: K8sResourceConfig = {
      apiVersion: "v1",
      group: "",
      version: "v1",
      kind: "PersistentVolume",
      singularName: "persistentvolume",
      pluralName: "persistentvolumes",
    };

    const result = createCustomResourceURL({
      resourceConfig,
      namespace: "default",
    });

    expect(result).toBe("/api/v1/persistentvolumes");
  });
});
