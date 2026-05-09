import { describe, expect, test } from "vitest";
import { eventListenerSchema, gitServerSchema } from "@my-project/shared";
import { EventListenerTopology, ResolvedTriggerNode } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { NODE_KIND } from "../constants";
import { buildEdges, buildNodes } from "./useEventFlowGraphData";

const ns = "ns-a";
const elName = "el-1";

const eventListener = eventListenerSchema.parse({
  apiVersion: "triggers.tekton.dev/v1beta1",
  kind: "EventListener",
  metadata: { name: elName, namespace: ns, uid: "el-uid", creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
  spec: { triggers: [] },
});

const baseTopology = (overrides: Partial<EventListenerTopology>): EventListenerTopology => ({
  eventListener,
  address: null,
  ready: true,
  gitServer: null,
  triggers: [],
  ...overrides,
});

const triggerRefNode = (overrides: Partial<ResolvedTriggerNode> = {}): ResolvedTriggerNode => ({
  source: { kind: "triggerRef", ref: "g", resolved: null, status: "resolved" },
  interceptors: [],
  bindings: [],
  template: { ref: "tt", resolved: null, status: "resolved", pipelineRef: { kind: "unknown" } },
  latestPipelineRun: null,
  ...overrides,
});

const inlineNode = (overrides: Partial<ResolvedTriggerNode> = {}): ResolvedTriggerNode => ({
  source: { kind: "inline", name: "inline-1" },
  interceptors: [],
  bindings: [],
  template: { ref: "tt", resolved: null, status: "resolved", pipelineRef: { kind: "unknown" } },
  latestPipelineRun: null,
  ...overrides,
});

describe("buildNodes", () => {
  test("emits EventListener node only when no triggers and no gitServer", () => {
    const result = buildNodes(baseTopology({}));
    expect(result.map((n) => n.id)).toEqual(["node::eventListener"]);
    expect(result[0].type).toBe(NODE_KIND.EVENT_LISTENER);
  });

  test("prepends a gitSource node when topology.gitServer is set", () => {
    const gitServer = gitServerSchema.parse({
      apiVersion: "edp.epam.com/v1",
      kind: "GitServer",
      metadata: { name: "gh", namespace: ns, uid: "u-gh", creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
      spec: { gitProvider: "github", gitHost: "github.com", httpsPort: 443, nameSshKeySecret: "git-key", sshPort: 22 },
      status: {},
    });
    const result = buildNodes(baseTopology({ gitServer }));
    expect(result.map((n) => n.id)).toEqual(["node::gitSource", "node::eventListener"]);
  });

  test("triggerRef trigger emits trigger + template + pipeline nodes", () => {
    const result = buildNodes(baseTopology({ triggers: [triggerRefNode()] }));
    expect(result.map((n) => n.id)).toEqual([
      "node::eventListener",
      "node::trigger::g-0",
      "node::template::g-0",
      "node::pipeline::g-0",
    ]);
  });

  test("inline trigger emits no trigger node — only template + pipeline", () => {
    const result = buildNodes(baseTopology({ triggers: [inlineNode()] }));
    expect(result.map((n) => n.id)).toEqual([
      "node::eventListener",
      "node::template::inline-1-0",
      "node::pipeline::inline-1-0",
    ]);
  });

  test("interceptors and bindings get unique numbered ids per trigger", () => {
    const result = buildNodes(
      baseTopology({
        triggers: [
          triggerRefNode({
            interceptors: [
              {
                ref: { name: "i1", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
              {
                ref: { name: "i2", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
            ],
            bindings: [
              { ref: "b1", kind: "TriggerBinding", resolved: null, status: "resolved" },
              { ref: "b2", kind: "TriggerBinding", resolved: null, status: "resolved" },
            ],
          }),
        ],
      })
    );
    const ids = result.map((n) => n.id);
    expect(ids).toContain("node::interceptor::g-0::0");
    expect(ids).toContain("node::interceptor::g-0::1");
    expect(ids).toContain("node::binding::g-0::0");
    expect(ids).toContain("node::binding::g-0::1");
  });
});

describe("buildEdges", () => {
  test("no triggers → no edges (gitServer absent)", () => {
    expect(buildEdges(baseTopology({}))).toEqual([]);
  });

  test("gitServer → eventListener edge added", () => {
    const gitServer = gitServerSchema.parse({
      apiVersion: "edp.epam.com/v1",
      kind: "GitServer",
      metadata: { name: "gh", namespace: ns, uid: "u-gh", creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
      spec: { gitProvider: "github", gitHost: "github.com", httpsPort: 443, nameSshKeySecret: "git-key", sshPort: 22 },
      status: {},
    });
    const edges = buildEdges(baseTopology({ gitServer }));
    expect(edges.map((e) => e.id)).toEqual(["edge::git→el"]);
    expect(edges[0]).toMatchObject({ source: "node::gitSource", target: "node::eventListener" });
  });

  test("triggerRef with no interceptors and no bindings: EL → trigger → template → pipeline", () => {
    const edges = buildEdges(baseTopology({ triggers: [triggerRefNode()] }));
    expect(edges.map((e) => ({ source: e.source, target: e.target }))).toEqual([
      { source: "node::eventListener", target: "node::trigger::g-0" },
      { source: "node::trigger::g-0", target: "node::template::g-0" },
      { source: "node::template::g-0", target: "node::pipeline::g-0" },
    ]);
  });

  test("inline trigger with no interceptors and no bindings: EL → template directly (no trigger node)", () => {
    const edges = buildEdges(baseTopology({ triggers: [inlineNode()] }));
    expect(edges.map((e) => ({ source: e.source, target: e.target }))).toEqual([
      { source: "node::eventListener", target: "node::template::inline-1-0" },
      { source: "node::template::inline-1-0", target: "node::pipeline::inline-1-0" },
    ]);
  });

  test("multiple interceptors chain head-to-tail", () => {
    const edges = buildEdges(
      baseTopology({
        triggers: [
          triggerRefNode({
            interceptors: [
              {
                ref: { name: "i1", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
              {
                ref: { name: "i2", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
              {
                ref: { name: "i3", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
            ],
          }),
        ],
      })
    );
    const pairs = edges.map((e) => ({ source: e.source, target: e.target }));
    expect(pairs).toContainEqual({ source: "node::interceptor::g-0::0", target: "node::interceptor::g-0::1" });
    expect(pairs).toContainEqual({ source: "node::interceptor::g-0::1", target: "node::interceptor::g-0::2" });
    // last interceptor → template (no bindings)
    expect(pairs).toContainEqual({ source: "node::interceptor::g-0::2", target: "node::template::g-0" });
  });

  test("interceptors fan out to every binding, and every binding connects to the template", () => {
    const edges = buildEdges(
      baseTopology({
        triggers: [
          triggerRefNode({
            interceptors: [
              {
                ref: { name: "i1", kind: "NamespacedInterceptor" },
                resolved: null,
                status: "resolved",
                params: [],
              },
            ],
            bindings: [
              { ref: "b1", kind: "TriggerBinding", resolved: null, status: "resolved" },
              { ref: "b2", kind: "TriggerBinding", resolved: null, status: "resolved" },
            ],
          }),
        ],
      })
    );
    const pairs = edges.map((e) => ({ source: e.source, target: e.target }));
    expect(pairs).toContainEqual({ source: "node::interceptor::g-0::0", target: "node::binding::g-0::0" });
    expect(pairs).toContainEqual({ source: "node::interceptor::g-0::0", target: "node::binding::g-0::1" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::0", target: "node::template::g-0" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::1", target: "node::template::g-0" });
  });

  test("triggerRef with no interceptors but with bindings: trigger → binding → template", () => {
    const edges = buildEdges(
      baseTopology({
        triggers: [
          triggerRefNode({
            bindings: [{ ref: "b1", kind: "TriggerBinding", resolved: null, status: "resolved" }],
          }),
        ],
      })
    );
    const pairs = edges.map((e) => ({ source: e.source, target: e.target }));
    expect(pairs).toContainEqual({ source: "node::trigger::g-0", target: "node::binding::g-0::0" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::0", target: "node::template::g-0" });
  });

  test("triggerRef with no interceptors and multiple bindings: every binding has an incoming edge from the trigger", () => {
    const edges = buildEdges(
      baseTopology({
        triggers: [
          triggerRefNode({
            bindings: [
              { ref: "b1", kind: "TriggerBinding", resolved: null, status: "resolved" },
              { ref: "b2", kind: "TriggerBinding", resolved: null, status: "resolved" },
              { ref: "b3", kind: "TriggerBinding", resolved: null, status: "resolved" },
            ],
          }),
        ],
      })
    );
    const pairs = edges.map((e) => ({ source: e.source, target: e.target }));
    expect(pairs).toContainEqual({ source: "node::trigger::g-0", target: "node::binding::g-0::0" });
    expect(pairs).toContainEqual({ source: "node::trigger::g-0", target: "node::binding::g-0::1" });
    expect(pairs).toContainEqual({ source: "node::trigger::g-0", target: "node::binding::g-0::2" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::0", target: "node::template::g-0" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::1", target: "node::template::g-0" });
    expect(pairs).toContainEqual({ source: "node::binding::g-0::2", target: "node::template::g-0" });
  });

  test("inline trigger with no interceptors and multiple bindings: every binding has an incoming edge from the EventListener", () => {
    const edges = buildEdges(
      baseTopology({
        triggers: [
          inlineNode({
            bindings: [
              { ref: "b1", kind: "TriggerBinding", resolved: null, status: "resolved" },
              { ref: "b2", kind: "TriggerBinding", resolved: null, status: "resolved" },
            ],
          }),
        ],
      })
    );
    const pairs = edges.map((e) => ({ source: e.source, target: e.target }));
    expect(pairs).toContainEqual({ source: "node::eventListener", target: "node::binding::inline-1-0::0" });
    expect(pairs).toContainEqual({ source: "node::eventListener", target: "node::binding::inline-1-0::1" });
    expect(pairs).toContainEqual({ source: "node::binding::inline-1-0::0", target: "node::template::inline-1-0" });
    expect(pairs).toContainEqual({ source: "node::binding::inline-1-0::1", target: "node::template::inline-1-0" });
  });
});
