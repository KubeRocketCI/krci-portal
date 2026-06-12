import { describe, expect, it } from "vitest";
import type { V1ResourceRule } from "@kubernetes/client-node";
import { mapRulesToCatalog, WILDCARD_RESOURCE } from "./mapRulesToCatalog.js";

const rule = (overrides: Partial<V1ResourceRule>): V1ResourceRule => ({
  verbs: ["get", "list", "watch"],
  ...overrides,
});

describe("mapRulesToCatalog", () => {
  it("groups custom-resource rules by group and plural with their verbs", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["codebasebranches"], verbs: ["*"] }),
      rule({
        apiGroups: ["v2.edp.epam.com"],
        resources: ["stages", "cdpipelines"],
        verbs: ["get", "list", "watch", "create", "update", "patch", "delete"],
      }),
      rule({ apiGroups: ["v1.edp.epam.com"], resources: ["clusterkeycloaks"] }),
    ]);

    expect(Array.from(result.keys()).sort()).toEqual(["v1.edp.epam.com", "v2.edp.epam.com"]);
    const v2 = result.get("v2.edp.epam.com")!;
    expect(v2.get("codebasebranches")).toEqual(["*"]);
    expect(v2.get("stages")).toEqual(["get", "list", "watch", "create", "update", "patch", "delete"]);
    expect(v2.get("cdpipelines")).toEqual(["get", "list", "watch", "create", "update", "patch", "delete"]);
    expect(result.get("v1.edp.epam.com")!.get("clusterkeycloaks")).toEqual(["get", "list", "watch"]);
  });

  it("excludes the core group and built-in/aggregated groups", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: [""], resources: ["pods"] }),
      rule({ apiGroups: ["apps"], resources: ["deployments"] }),
      rule({ apiGroups: ["authorization.k8s.io"], resources: ["selfsubjectrulesreviews"], verbs: ["create"] }),
      rule({ apiGroups: ["metrics.k8s.io"], resources: ["pods"] }),
    ]);

    expect(result.size).toBe(0);
  });

  it("excludes wildcard apiGroups entirely", () => {
    const result = mapRulesToCatalog([rule({ apiGroups: ["*"], resources: ["codebasebranches"] })]);

    expect(result.size).toBe(0);
  });

  it("excludes the wildcard group but keeps specific groups from the same rule", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["*", "v2.edp.epam.com"], resources: ["codebasebranches"], verbs: ["get"] }),
    ]);

    expect(Array.from(result.keys())).toEqual(["v2.edp.epam.com"]);
    expect(result.get("v2.edp.epam.com")!.get("codebasebranches")).toEqual(["get"]);
  });

  it("keeps a per-group resources wildcard under the sentinel key", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["*"], verbs: ["get", "list"] }),
    ]);

    expect(result.get("v2.edp.epam.com")!.get(WILDCARD_RESOURCE)).toEqual(["get", "list"]);
  });

  it("excludes subresources", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["codebases/status", "pods/log"] }),
    ]);

    expect(result.size).toBe(0);
  });

  it("excludes instance-scoped grants (resourceNames non-empty)", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["codebasebranches"], resourceNames: ["main"] }),
    ]);

    expect(result.size).toBe(0);
  });

  it("merges and dedupes verbs from multiple rules for the same group/plural", () => {
    const result = mapRulesToCatalog([
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["get", "list"] }),
      rule({ apiGroups: ["v2.edp.epam.com"], resources: ["stages"], verbs: ["list", "update"] }),
    ]);

    expect(result.get("v2.edp.epam.com")!.get("stages")).toEqual(["get", "list", "update"]);
  });

  it("tolerates rules with missing optional fields", () => {
    const result = mapRulesToCatalog([
      { verbs: ["get"] },
      { verbs: ["get"], apiGroups: ["v2.edp.epam.com"] },
      { verbs: [], apiGroups: ["v2.edp.epam.com"], resources: ["stages"] },
    ]);

    expect(result.get("v2.edp.epam.com")!.get("stages")).toEqual([]);
  });

  it("returns an empty map for no rules", () => {
    expect(mapRulesToCatalog([]).size).toBe(0);
  });
});
