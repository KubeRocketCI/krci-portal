import { describe, expect, it } from "vitest";
import { createPinConfig } from "./utils";

// createPinConfig delegates key construction to buildPinKey; the deeper
// key-format tests live in pinKey.test.ts. Here we verify the full shape of
// the returned PinnedPage and the cluster-agnostic key behaviour.

describe("createPinConfig", () => {
  describe("KRCI route with only clusterName param — backward-compatible key format", () => {
    it("produces a key without a query suffix", () => {
      const config = createPinConfig("Pipelines", {
        to: "/c/$clusterName/cicd/pipelines",
        params: { clusterName: "dev" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(config.key).toBe("page:/c/$clusterName/cicd/pipelines");
    });

    it("sets label, route.to, and route.params correctly", () => {
      const config = createPinConfig("Pipelines", {
        to: "/c/$clusterName/cicd/pipelines",
        params: { clusterName: "dev" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(config.label).toBe("Pipelines");
      expect(config.route.to).toBe("/c/$clusterName/cicd/pipelines");
      expect(config.route.params).toEqual({ clusterName: "dev" });
    });

    it("derives iconType from the path", () => {
      const config = createPinConfig("Pipelines", {
        to: "/c/$clusterName/cicd/pipelines",
        params: { clusterName: "dev" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(config.iconType).toBe("pipelines");
      expect(config.type).toBe("pipelines");
    });
  });

  describe("generic K8s list route parameterised by kind", () => {
    it("produces distinct keys for Deployments and StatefulSets", () => {
      const deployments = createPinConfig("Deployments", {
        to: "/c/$clusterName/k8s/$kind",
        params: { clusterName: "dev", kind: "deployments" },
      } as Parameters<typeof createPinConfig>[1]);

      const statefulsets = createPinConfig("StatefulSets", {
        to: "/c/$clusterName/k8s/$kind",
        params: { clusterName: "dev", kind: "statefulsets" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(deployments.key).not.toBe(statefulsets.key);
    });

    it("embeds the kind in the key query suffix", () => {
      const config = createPinConfig("DaemonSets", {
        to: "/c/$clusterName/k8s/$kind",
        params: { clusterName: "dev", kind: "daemonsets" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(config.key).toBe("page:/c/$clusterName/k8s/$kind?kind=daemonsets");
    });

    it("key is identical for the same kind across different clusters", () => {
      const clusterA = createPinConfig("Jobs", {
        to: "/c/$clusterName/k8s/$kind",
        params: { clusterName: "cluster-a", kind: "jobs" },
      } as Parameters<typeof createPinConfig>[1]);

      const clusterB = createPinConfig("Jobs", {
        to: "/c/$clusterName/k8s/$kind",
        params: { clusterName: "cluster-b", kind: "jobs" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(clusterA.key).toBe(clusterB.key);
    });
  });

  describe("CR list route parameterised by group, version, plural", () => {
    it("produces a key with params sorted deterministically", () => {
      const config = createPinConfig("My CRs", {
        to: "/c/$clusterName/k8s/cr/$group/$version/$plural",
        params: { clusterName: "dev", group: "apps", version: "v1", plural: "mycrds" },
      } as Parameters<typeof createPinConfig>[1]);

      // params sorted: group, plural, version (alphabetical, clusterName excluded)
      expect(config.key).toBe(
        "page:/c/$clusterName/k8s/cr/$group/$version/$plural?group=apps&plural=mycrds&version=v1"
      );
    });

    it("produces the same key regardless of param object insertion order", () => {
      const a = createPinConfig("My CRs", {
        to: "/c/$clusterName/k8s/cr/$group/$version/$plural",
        params: { plural: "mycrds", clusterName: "dev", version: "v1", group: "apps" },
      } as Parameters<typeof createPinConfig>[1]);

      const b = createPinConfig("My CRs", {
        to: "/c/$clusterName/k8s/cr/$group/$version/$plural",
        params: { version: "v1", group: "apps", clusterName: "dev", plural: "mycrds" },
      } as Parameters<typeof createPinConfig>[1]);

      expect(a.key).toBe(b.key);
    });
  });
});
