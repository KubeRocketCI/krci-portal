import { describe, expect, it } from "vitest";
import { workerPoolSchema } from "./schema.js";

const FIXTURE = {
  apiVersion: "ate.dev/v1",
  kind: "WorkerPool",
  metadata: {
    name: "workers",
    namespace: "krci-agents",
    uid: "c15cbe72-ef7b-4201-a3c7-549de0e0835d",
    creationTimestamp: "2026-11-10T13:30:35Z",
  },
  spec: {
    replicas: 1,
    sandboxClasses: [{ name: "gvisor" }],
    template: { resources: { limits: { cpu: "1", memory: "2560Mi" } } },
    workerImage: "ghcr.io/agent-substrate/substrate/ateworker-gvisor:v1.0.1",
  },
  status: {
    readyReplicas: 1,
    replicas: 1,
    sandboxClasses: [
      {
        name: "gvisor",
        configRef: { name: "gvisor-default" },
        conditions: [
          {
            type: "Resolved",
            status: "True",
            reason: "Resolved",
            message: 'resolved to SandboxConfig "gvisor-default"',
            lastTransitionTime: "2026-11-10T13:30:35Z",
            observedGeneration: 2,
          },
        ],
      },
    ],
    selector: "ate.dev/worker-pool=workers",
  },
};

describe("workerPoolSchema", () => {
  it("(a) minimal-valid: required metadata + kind + apiVersion + empty spec parses", () => {
    const obj = {
      apiVersion: "ate.dev/v1",
      kind: "WorkerPool",
      metadata: { name: "wp-min", uid: "uid-min-001", creationTimestamp: "2026-11-01T00:00:00Z" },
      spec: {},
    };
    expect(workerPoolSchema.safeParse(obj).success).toBe(true);
  });

  it("(b) partial/early: spec present but status absent", () => {
    const obj = {
      apiVersion: "ate.dev/v1",
      kind: "WorkerPool",
      metadata: { name: "wp-early", uid: "uid-early-002", creationTimestamp: "2026-11-01T00:00:00Z" },
      spec: { replicas: 2, sandboxClasses: [{ name: "microvm" }] },
    };
    const result = workerPoolSchema.safeParse(obj);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.status).toBeUndefined();
    expect(result.data.spec?.replicas).toBe(2);
  });

  it("(c) real-sample: fixture parses and read fields are typed", () => {
    const result = workerPoolSchema.safeParse(FIXTURE);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const { spec, status } = result.data;
    expect(spec?.replicas).toBe(1);
    expect(spec?.sandboxClasses?.[0]?.name).toBe("gvisor");
    expect(status?.readyReplicas).toBe(1);
    expect(status?.sandboxClasses?.[0]?.conditions?.[0]?.type).toBe("Resolved");
    expect(status?.sandboxClasses?.[0]?.conditions?.[0]?.reason).toBe("Resolved");
  });

  it("(d) forward-compat: unknown field in spec is preserved (passthrough)", () => {
    const extended = { ...FIXTURE, spec: { ...FIXTURE.spec, __unknownX: 1 } };
    const result = workerPoolSchema.safeParse(extended);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect((result.data.spec as Record<string, unknown>)["__unknownX"]).toBe(1);
  });

  it("(e) defensive: object with metadata but no spec and no status parses", () => {
    const obj = {
      apiVersion: "ate.dev/v1",
      kind: "WorkerPool",
      metadata: { name: "wp-nospec", uid: "uid-nospec-003", creationTimestamp: "2026-11-01T00:00:00Z" },
    };
    expect(workerPoolSchema.safeParse(obj).success).toBe(true);
  });
});
