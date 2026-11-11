import { describe, expect, it } from "vitest";
import {
  clusterTag,
  imageTagOf,
  namespaceLabelTag,
  namespaceTag,
  normalizeImage,
  ociImageTag,
  tagSafe,
  workloadsOf,
} from "./tags.js";

describe("tagSafe", () => {
  it("lower-cases and trims the value", () => {
    expect(tagSafe("  Tenant-A  ")).toBe("tenant-a");
  });

  it.each([
    ["a space", "a b", "a-b"],
    ["a tab", "a\tb", "a-b"],
    ["a comma", "a,b", "a-b"],
    ["a single quote", "a'b", "a-b"],
    ["a double quote", 'a"b', "a-b"],
  ])("replaces %s with a dash", (_name, value, expected) => {
    expect(tagSafe(value)).toBe(expected);
  });

  it("keeps the characters tags may hold", () => {
    expect(tagSafe("registry.example.com:5000/krci/app_1")).toBe("registry.example.com:5000/krci/app_1");
  });
});

describe("normalizeImage", () => {
  // The vectors of TestNormalizeImage in the krci-security-operator (pkg/trivy/image_test.go).
  it.each([
    ["registry with port and tag", "registry.example.com:5000/krci/app:1.0.0", "registry.example.com:5000/krci/app"],
    ["registry with port without tag", "registry.example.com:5000/krci/app", "registry.example.com:5000/krci/app"],
    ["digest", "registry.example.com/krci/app@sha256:abc", "registry.example.com/krci/app"],
    ["tag and digest", "registry.example.com/krci/app:1.0.0@sha256:abc", "registry.example.com/krci/app"],
    ["upper case", "Registry.Example.com/KRCI/App:1", "registry.example.com/krci/app"],
    ["docker.io with library", "docker.io/library/nginx:1.27", "nginx"],
    ["index.docker.io with library", "index.docker.io/library/postgres", "postgres"],
    ["registry-1.docker.io", "registry-1.docker.io/valkey/valkey:9", "valkey/valkey"],
    ["docker.io user image", "docker.io/epamedp/cd-pipeline-operator:2.35.0", "epamedp/cd-pipeline-operator"],
    ["implicit docker hub", "nginx:1.27", "nginx"],
    ["non hub library path is kept", "quay.io/library/app", "quay.io/library/app"],
    ["empty", "", ""],
  ])("%s", (_name, reference, expected) => {
    expect(normalizeImage(reference)).toBe(expected);
  });

  it.each([
    ["a host with a port and no repository path", "localhost:5000", "localhost"],
    ["a docker hub host in upper case", "Docker.IO/Library/Nginx:1", "nginx"],
    ["a docker hub host without a repository", "docker.io", "docker.io"],
    [
      "a digest without a tag next to a port",
      "registry.example.com:5000/app@sha256:abc",
      "registry.example.com:5000/app",
    ],
    ["library below another path segment", "docker.io/bitnami/library/redis", "bitnami/library/redis"],
  ])("handles %s as the operator does", (_name, reference, expected) => {
    expect(normalizeImage(reference)).toBe(expected);
  });
});

describe("tag builders", () => {
  it("builds the cluster and namespace tags", () => {
    expect(clusterTag("in-cluster")).toBe("k8s-cluster:in-cluster");
    expect(namespaceTag("krci-demo-dev")).toBe("k8s-namespace:krci-demo-dev");
  });

  it("builds the tag of a namespace label from the label key and the value", () => {
    expect(namespaceLabelTag("app.edp.epam.com/tenant", "krci")).toBe("k8s-ns-label.app.edp.epam.com/tenant:krci");
  });

  it("makes the key and the value of the namespace label tag tag-safe", () => {
    expect(namespaceLabelTag("App.EDP.epam.com/Tenant", "My Tenant")).toBe(
      "k8s-ns-label.app.edp.epam.com/tenant:my-tenant"
    );
  });

  describe("ociImageTag", () => {
    it("prefixes the normalized image", () => {
      expect(ociImageTag("Registry.Example.com:5000/KRCI/App:1.0.0@sha256:abc")).toBe(
        "oci-image:registry.example.com:5000/krci/app"
      );
    });

    it("writes a Docker Hub image without host and library", () => {
      expect(ociImageTag("docker.io/library/redis:7.4")).toBe("oci-image:redis");
    });

    it("makes the value tag-safe", () => {
      expect(ociImageTag(' registry.example.com/my app,"x" ')).toBe("oci-image:registry.example.com/my-app--x-");
    });

    it("is undefined for a reference that names no image", () => {
      expect(ociImageTag("")).toBeUndefined();
      expect(ociImageTag("   ")).toBeUndefined();
    });
  });
});

describe("tag readers", () => {
  it("reads the oci-image tag of a test", () => {
    expect(imageTagOf(["k8s-cluster:in-cluster", "oci-image:nginx", "app:web"])).toBe("oci-image:nginx");
  });

  it("finds no image tag on a test that names no image", () => {
    expect(imageTagOf(["k8s-cluster:in-cluster"])).toBeUndefined();
  });

  it("reads <kind>/<name> from the workload tags", () => {
    expect(workloadsOf(["k8s-workload:deployment.test-go-app", "k8s-namespace:krci-demo-dev"])).toEqual([
      "deployment/test-go-app",
    ]);
  });

  it("keeps a dot of the workload name", () => {
    expect(workloadsOf(["k8s-workload:statefulset.db.v2"])).toEqual(["statefulset/db.v2"]);
  });

  it("finds no workload on a test without a workload tag", () => {
    expect(workloadsOf(["k8s-cluster:in-cluster", "oci-image:nginx"])).toEqual([]);
  });
});
