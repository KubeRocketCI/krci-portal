import { describe, expect, it } from "vitest";
import { buildPinKey } from "./index";

describe("buildPinKey", () => {
  describe("routes whose only param is clusterName", () => {
    it("produces a key identical to the old page:<path> format", () => {
      expect(buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "dev" })).toBe(
        "page:/c/$clusterName/cicd/pipelines"
      );
    });

    it("produces the same key regardless of clusterName value", () => {
      const a = buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "prod" });
      const b = buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "dev" });
      expect(a).toBe(b);
    });

    it("produces a key without a query suffix when params is empty", () => {
      expect(buildPinKey("/c/$clusterName/cicd/pipelines", {})).toBe("page:/c/$clusterName/cicd/pipelines");
    });

    it("produces a key without a query suffix when params is omitted", () => {
      expect(buildPinKey("/c/$clusterName/cicd/pipelines")).toBe("page:/c/$clusterName/cicd/pipelines");
    });
  });

  describe("params that are not path segments", () => {
    it("ignores a namespace passed to a cluster-wide page", () => {
      expect(buildPinKey("/c/$clusterName/projects", { clusterName: "dev", namespace: "krci" })).toBe(
        "page:/c/$clusterName/projects"
      );
    });

    it("yields the same key for a cluster-wide page across namespaces", () => {
      const a = buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "dev", namespace: "team-a" });
      const b = buildPinKey("/c/$clusterName/cicd/pipelines", { clusterName: "dev", namespace: "team-b" });
      expect(a).toBe(b);
    });

    it("keeps namespace when the path declares it", () => {
      expect(buildPinKey("/c/$clusterName/overview/$namespace", { clusterName: "dev", namespace: "krci" })).toBe(
        "page:/c/$clusterName/overview/$namespace?namespace=krci"
      );
    });
  });

  describe("generic K8s list route parameterised by kind", () => {
    it("produces distinct keys for different kinds", () => {
      const deployments = buildPinKey("/c/$clusterName/k8s/$kind", {
        clusterName: "dev",
        kind: "deployments",
      });
      const statefulsets = buildPinKey("/c/$clusterName/k8s/$kind", {
        clusterName: "dev",
        kind: "statefulsets",
      });
      expect(deployments).not.toBe(statefulsets);
    });

    it("includes kind in the query suffix", () => {
      expect(buildPinKey("/c/$clusterName/k8s/$kind", { clusterName: "dev", kind: "deployments" })).toBe(
        "page:/c/$clusterName/k8s/$kind?kind=deployments"
      );
    });

    it("is cluster-agnostic — same kind on different clusters yields identical key", () => {
      const a = buildPinKey("/c/$clusterName/k8s/$kind", { clusterName: "cluster-a", kind: "jobs" });
      const b = buildPinKey("/c/$clusterName/k8s/$kind", { clusterName: "cluster-b", kind: "jobs" });
      expect(a).toBe(b);
    });
  });

  describe("CR list route parameterised by group, version, plural", () => {
    it("includes all identifying params sorted by key name", () => {
      expect(
        buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", {
          clusterName: "dev",
          group: "apps",
          version: "v1",
          plural: "mycrds",
        })
      ).toBe("page:/c/$clusterName/k8s/cr/$group/$version/$plural?group=apps&plural=mycrds&version=v1");
    });

    it("produces the same key regardless of param insertion order", () => {
      // params supplied in a different order — result must be identical
      const a = buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", {
        plural: "mycrds",
        clusterName: "dev",
        version: "v1",
        group: "apps",
      });
      const b = buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", {
        version: "v1",
        group: "apps",
        clusterName: "dev",
        plural: "mycrds",
      });
      expect(a).toBe(b);
    });

    it("produces distinct keys for different group/version/plural combinations", () => {
      const cr1 = buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", {
        clusterName: "dev",
        group: "apps",
        version: "v1",
        plural: "widgets",
      });
      const cr2 = buildPinKey("/c/$clusterName/k8s/cr/$group/$version/$plural", {
        clusterName: "dev",
        group: "apps",
        version: "v1",
        plural: "gadgets",
      });
      expect(cr1).not.toBe(cr2);
    });
  });
});
