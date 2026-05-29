import { describe, expect, it } from "vitest";
import { buildCRDescriptor } from "./buildCRDescriptor";

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
