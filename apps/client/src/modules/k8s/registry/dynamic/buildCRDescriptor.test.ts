import { describe, expect, it } from "vitest";
import { buildCRDescriptor } from "./buildCRDescriptor";
import {
  gatewayColumns,
  httpRouteColumns,
  securityPolicyColumns,
  backendTrafficPolicyColumns,
  clientTrafficPolicyColumns,
} from "./firstClass/columns";
import { GatewayOverviewTab } from "@/modules/k8s/components/overrides/GatewayOverviewTab";
import { HTTPRouteOverviewTab } from "@/modules/k8s/components/overrides/HTTPRouteOverviewTab";
import { PolicyOverviewTab } from "@/modules/k8s/components/overrides/PolicyOverviewTab";

const baseCrd = (overrides: Record<string, unknown> = {}) =>
  ({
    metadata: { name: "pipelineruns.tekton.dev" },
    spec: {
      group: "tekton.dev",
      scope: "Namespaced",
      names: { kind: "PipelineRun", plural: "pipelineruns", singular: "pipelinerun" },
      versions: [
        {
          name: "v1beta1",
          served: true,
          storage: false,
          additionalPrinterColumns: [{ name: "Status", type: "string", jsonPath: ".status.phase" }],
        },
        {
          name: "v1",
          served: true,
          storage: true,
          additionalPrinterColumns: [
            { name: "Status", type: "string", jsonPath: ".status.phase" },
            { name: "Created", type: "date", jsonPath: ".metadata.creationTimestamp" },
          ],
        },
      ],
      ...overrides,
    },
  }) as never;

describe("buildCRDescriptor — version resolution", () => {
  it("uses preferredVersion when provided and present", () => {
    const d = buildCRDescriptor(baseCrd(), "v1beta1");
    expect(d.config.apiVersion).toBe("tekton.dev/v1beta1");
    expect(d.config.version).toBe("v1beta1");
  });
  it("falls back to storage version when preferredVersion is missing", () => {
    const d = buildCRDescriptor(baseCrd(), "v1alpha1");
    expect(d.config.version).toBe("v1");
  });
  it("uses storage version when preferredVersion is omitted", () => {
    const d = buildCRDescriptor(baseCrd());
    expect(d.config.version).toBe("v1");
  });
  it("falls back to versions[0] when no version has storage:true", () => {
    const d = buildCRDescriptor(baseCrd({ versions: [{ name: "v1beta1", served: true, storage: false }] }));
    expect(d.config.version).toBe("v1beta1");
  });
  it("ignores a preferredVersion that has served:false (falls back to storage version)", () => {
    const d = buildCRDescriptor(
      baseCrd({
        versions: [
          { name: "v1beta1", served: false, storage: false },
          { name: "v1", served: true, storage: true },
        ],
      }),
      "v1beta1"
    );
    expect(d.config.version).toBe("v1");
  });
});

describe("buildCRDescriptor — config", () => {
  it("sets apiVersion=group/version for non-core groups", () => {
    expect(buildCRDescriptor(baseCrd(), "v1").config.apiVersion).toBe("tekton.dev/v1");
  });
  it("sets apiVersion=version for core-group (empty group)", () => {
    expect(buildCRDescriptor(baseCrd({ group: "" })).config.apiVersion).toBe("v1");
  });
  it("propagates clusterScoped from spec.scope", () => {
    expect(buildCRDescriptor(baseCrd({ scope: "Cluster" })).config.clusterScoped).toBe(true);
    expect(buildCRDescriptor(baseCrd()).config.clusterScoped).toBe(false);
  });
  it("sets defaultSort to name asc, consistent with the static CRD descriptor", () => {
    expect(buildCRDescriptor(baseCrd()).defaultSort).toEqual({ sortBy: "name", order: "asc" });
  });
});

describe("buildCRDescriptor — first-class overrides (WS-B)", () => {
  function makeCrd(group: string, kind: string, plural: string) {
    return {
      metadata: { name: `${plural}.${group}` },
      spec: {
        group,
        scope: "Namespaced",
        names: { kind, plural, singular: kind.toLowerCase() },
        versions: [{ name: "v1", served: true, storage: true, additionalPrinterColumns: [] }],
      },
    } as never;
  }

  it("Gateway CRD uses gatewayColumns and GatewayOverviewTab", () => {
    const d = buildCRDescriptor(makeCrd("gateway.networking.k8s.io", "Gateway", "gateways"));
    expect(d.columns).toBe(gatewayColumns);
    expect(d.overviewTab).toBe(GatewayOverviewTab);
  });

  it("SecurityPolicy CRD uses securityPolicyColumns and PolicyOverviewTab", () => {
    const d = buildCRDescriptor(makeCrd("gateway.envoyproxy.io", "SecurityPolicy", "securitypolicies"));
    expect(d.columns).toBe(securityPolicyColumns);
    expect(d.overviewTab).toBe(PolicyOverviewTab);
  });

  it("HTTPRoute CRD uses httpRouteColumns and HTTPRouteOverviewTab", () => {
    const d = buildCRDescriptor(makeCrd("gateway.networking.k8s.io", "HTTPRoute", "httproutes"));
    expect(d.columns).toBe(httpRouteColumns);
    expect(d.overviewTab).toBe(HTTPRouteOverviewTab);
  });

  it("BackendTrafficPolicy CRD uses backendTrafficPolicyColumns and PolicyOverviewTab", () => {
    const d = buildCRDescriptor(makeCrd("gateway.envoyproxy.io", "BackendTrafficPolicy", "backendtrafficpolicies"));
    expect(d.columns).toBe(backendTrafficPolicyColumns);
    expect(d.overviewTab).toBe(PolicyOverviewTab);
  });

  it("ClientTrafficPolicy CRD uses clientTrafficPolicyColumns and PolicyOverviewTab", () => {
    const d = buildCRDescriptor(makeCrd("gateway.envoyproxy.io", "ClientTrafficPolicy", "clienttrafficpolicies"));
    expect(d.columns).toBe(clientTrafficPolicyColumns);
    expect(d.overviewTab).toBe(PolicyOverviewTab);
  });

  it("non-first-class CRD has no overviewTab and uses generic columns builder", () => {
    const d = buildCRDescriptor(makeCrd("some.example.com", "Widget", "widgets"));
    expect(d.overviewTab).toBeUndefined();
    // columns is a locally-built function, not one of the named first-class fns
    expect(d.columns).not.toBe(gatewayColumns);
    expect(d.columns).not.toBe(securityPolicyColumns);
  });
});

describe("buildCRDescriptor — columns", () => {
  it("filters .metadata.creationTimestamp JSONPath", () => {
    const d = buildCRDescriptor(baseCrd(), "v1");
    const cols = d.columns(((item: { metadata: { name: string } }) => item.metadata.name) as never);
    expect(cols.find((c) => c.id === "Created")).toBeUndefined();
  });
  it("only includes priority=0 columns (MVP)", () => {
    const d = buildCRDescriptor(
      baseCrd({
        versions: [
          {
            name: "v1",
            served: true,
            storage: true,
            additionalPrinterColumns: [
              { name: "A", type: "string", jsonPath: ".a" },
              { name: "B", type: "string", jsonPath: ".b", priority: 1 },
            ],
          },
        ],
      })
    );
    const cols = d.columns(((item: { metadata: { name: string } }) => item.metadata.name) as never);
    // Column id is `${name}-${idx}` so duplicate printer-column names don't collide.
    expect(cols.some((c) => c.label === "A")).toBe(true);
    expect(cols.some((c) => c.label === "B")).toBe(false);
  });
  it("appends a YAML quick-action column when no priority=0 printer columns remain", () => {
    const d = buildCRDescriptor(
      baseCrd({
        versions: [{ name: "v1", served: true, storage: true, additionalPrinterColumns: [] }],
      })
    );
    const cols = d.columns(((item: { metadata: { name: string } }) => item.metadata.name) as never);
    expect(cols[cols.length - 1].id).toBe("yaml-action");
  });
});
