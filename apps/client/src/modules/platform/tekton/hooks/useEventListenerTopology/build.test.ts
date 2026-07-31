import { describe, expect, test } from "vitest";
import {
  type PipelineRun,
  eventListenerSchema,
  triggerSchema,
  triggerBindingSchema,
  triggerTemplateSchema,
  interceptorSchema,
  clusterInterceptorSchema,
  pipelineRunSchema,
  gitServerSchema,
} from "@my-project/shared";
import { buildTopology } from "./build";

const ns = "edp-delivery";
const elName = "github-listener";

const baseEL = (overrides: object = {}) =>
  eventListenerSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "EventListener",
    metadata: { name: elName, namespace: ns, uid: "u-el", creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
    spec: { triggers: [] },
    status: {
      address: { url: `http://el-${elName}.${ns}.svc:8080` },
      conditions: [{ type: "Ready", status: "True" }],
    },
    ...overrides,
  });

const triggerCR = (name: string, spec: object) =>
  triggerSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "Trigger",
    metadata: { name, namespace: ns, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
    spec,
  });

const tb = (name: string) =>
  triggerBindingSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "TriggerBinding",
    metadata: { name, namespace: ns, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
    spec: {},
  });

const tt = (name: string, pipelineName: string | undefined, withResourceTemplate = true) =>
  triggerTemplateSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "TriggerTemplate",
    metadata: { name, namespace: ns, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
    spec: withResourceTemplate
      ? { resourcetemplates: [{ spec: pipelineName !== undefined ? { pipelineRef: { name: pipelineName } } : {} }] }
      : {},
  });

const interceptor = (name: string) =>
  interceptorSchema.parse({
    apiVersion: "triggers.tekton.dev/v1alpha1",
    kind: "Interceptor",
    metadata: { name, namespace: ns, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
  });

const ci = (name: string) =>
  clusterInterceptorSchema.parse({
    apiVersion: "triggers.tekton.dev/v1alpha1",
    kind: "ClusterInterceptor",
    metadata: { name, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z" },
  });

const makePR = (name: string, creationTimestamp: string, labels: Record<string, string>, status?: object) =>
  pipelineRunSchema.parse({
    apiVersion: "tekton.dev/v1",
    kind: "PipelineRun",
    metadata: {
      name,
      namespace: ns,
      uid: `u-${name}`,
      creationTimestamp,
      labels: { "app.edp.epam.com/pipelinetype": "build", ...labels },
    },
    spec: {},
    ...(status ? { status } : {}),
  });

const makeGS = (name: string, extraLabels: Record<string, string> = {}) =>
  gitServerSchema.parse({
    apiVersion: "edp.epam.com/v1",
    kind: "GitServer",
    metadata: { name, namespace: ns, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z", labels: extraLabels },
    spec: { gitProvider: "github", gitHost: "github.com", httpsPort: 443, nameSshKeySecret: "git-key", sshPort: 22 },
    status: {},
  });

const args = (overrides: Partial<Parameters<typeof buildTopology>[0]> = {}) => ({
  eventListener: baseEL(),
  triggersByName: new Map(),
  triggerBindingsByName: new Map(),
  triggerTemplatesByName: new Map(),
  interceptorsByName: new Map(),
  clusterInterceptorsByName: new Map(),
  gitServersByName: new Map(),
  recentRuns: [] as PipelineRun[],
  ...overrides,
});

describe("buildTopology — production triggerRef shape", () => {
  test("resolves Trigger CR and downstream refs", () => {
    const trig = triggerCR("github-build", {
      interceptors: [
        { ref: { name: "cel", kind: "ClusterInterceptor" }, params: [{ name: "filter", value: "body.x" }] },
      ],
      bindings: [{ ref: "common-binding" }],
      template: { ref: "build-template" },
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: { triggers: [{ triggerRef: "github-build" }] },
        }),
        triggersByName: new Map([["github-build", trig]]),
        triggerBindingsByName: new Map([["common-binding", tb("common-binding")]]),
        triggerTemplatesByName: new Map([["build-template", tt("build-template", "build-pipeline")]]),
        clusterInterceptorsByName: new Map([["cel", ci("cel")]]),
      })
    );
    expect(result.triggers).toHaveLength(1);
    const t = result.triggers[0];
    expect(t.source).toEqual({ kind: "triggerRef", ref: "github-build", resolved: trig, status: "resolved" });
    expect(t.interceptors[0].resolved?.metadata.name).toBe("cel");
    expect(t.interceptors[0].status).toBe("resolved");
    expect(t.bindings[0].resolved?.metadata.name).toBe("common-binding");
    expect(t.bindings[0].status).toBe("resolved");
    expect(t.template.resolved?.metadata.name).toBe("build-template");
    expect(t.template.status).toBe("resolved");
    expect(t.template.pipelineRef).toEqual({ kind: "literal", pipelineName: "build-pipeline" });
  });
});

describe("buildTopology — inline shape", () => {
  test("derives refs directly from EL spec", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [
              {
                name: "x",
                interceptors: [{ ref: { name: "i1", kind: "NamespacedInterceptor" }, params: [] }],
                bindings: [{ ref: "b1" }],
                template: { ref: "t1" },
              },
            ],
          },
        }),
        interceptorsByName: new Map([["i1", interceptor("i1")]]),
        triggerBindingsByName: new Map([["b1", tb("b1")]]),
        triggerTemplatesByName: new Map([["t1", tt("t1", "p1")]]),
      })
    );
    expect(result.triggers[0].source).toEqual({ kind: "inline", name: "x" });
    expect(result.triggers[0].interceptors[0].resolved?.metadata.name).toBe("i1");
  });
});

describe("buildTopology — dangling triggerRef", () => {
  test("renders entry with all refs unresolved, no crash", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "missing" }] } }),
      })
    );
    expect(result.triggers[0].source).toEqual({
      kind: "triggerRef",
      ref: "missing",
      resolved: null,
      status: "missing",
    });
    expect(result.triggers[0].interceptors).toHaveLength(0);
    expect(result.triggers[0].bindings).toHaveLength(0);
    expect(result.triggers[0].template.ref).toBe("");
    expect(result.triggers[0].template.resolved).toBeNull();
    expect(result.triggers[0].template.pipelineRef).toEqual({ kind: "unknown" });
  });
});

describe("buildTopology — triggerRef resolves but template ref is missing", () => {
  test("template.status is missing when Trigger CR exists but its template.ref points to an absent TriggerTemplate", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "gone" } });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
      })
    );
    expect(result.triggers[0].source).toMatchObject({ kind: "triggerRef", ref: "g", status: "resolved" });
    expect(result.triggers[0].template.ref).toBe("gone");
    expect(result.triggers[0].template.resolved).toBeNull();
    expect(result.triggers[0].template.status).toBe("missing");
    expect(result.triggers[0].template.pipelineRef).toEqual({ kind: "unknown" });
  });
});

describe("buildTopology — mixed interceptor kinds", () => {
  test("ClusterInterceptor and NamespacedInterceptor resolve from correct watch", () => {
    const trig = triggerCR("g", {
      interceptors: [
        { ref: { name: "cel", kind: "ClusterInterceptor" } },
        { ref: { name: "edp", kind: "NamespacedInterceptor" } },
      ],
      bindings: [],
      template: { ref: "" },
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        clusterInterceptorsByName: new Map([["cel", ci("cel")]]),
        interceptorsByName: new Map([["edp", interceptor("edp")]]),
      })
    );
    expect(result.triggers[0].interceptors[0].resolved?.metadata.name).toBe("cel");
    expect(result.triggers[0].interceptors[1].resolved?.metadata.name).toBe("edp");
  });
});

describe("buildTopology — ClusterTriggerBinding ref", () => {
  test("gracefully sets resolved=null without crashing", () => {
    const trig = triggerCR("g", {
      interceptors: [],
      bindings: [{ ref: "ctb-x", kind: "ClusterTriggerBinding" }],
      template: { ref: "" },
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
      })
    );
    expect(result.triggers[0].bindings[0]).toEqual({
      ref: "ctb-x",
      kind: "ClusterTriggerBinding",
      resolved: null,
      status: "restricted",
    });
  });
});

describe("buildTopology — restricted (watch unavailable)", () => {
  test("ClusterInterceptor ref reports status=restricted when its watch errored", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [
              {
                name: "inline",
                interceptors: [{ ref: { name: "cel", kind: "ClusterInterceptor" } }],
                bindings: [],
                template: { ref: "" },
              },
            ],
          },
        }),
        availability: { clusterInterceptors: false },
      })
    );
    const i = result.triggers[0].interceptors[0];
    expect(i.resolved).toBeNull();
    expect(i.status).toBe("restricted");
  });

  test("Namespaced Interceptor / TriggerBinding / TriggerTemplate report restricted independently", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [
              {
                name: "inline",
                interceptors: [{ ref: { name: "edp", kind: "NamespacedInterceptor" } }],
                bindings: [{ ref: "b1" }],
                template: { ref: "t1" },
              },
            ],
          },
        }),
        availability: { interceptors: false, triggerBindings: false, triggerTemplates: false },
      })
    );
    const t = result.triggers[0];
    expect(t.interceptors[0].status).toBe("restricted");
    expect(t.bindings[0].status).toBe("restricted");
    expect(t.template.status).toBe("restricted");
  });

  test("triggerRef reports restricted when Trigger watch errored, vs missing when it succeeded but ref is dangling", () => {
    // Watch errored → restricted
    const restricted = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        availability: { triggers: false },
      })
    );
    expect(restricted.triggers[0].source).toEqual({
      kind: "triggerRef",
      ref: "g",
      resolved: null,
      status: "restricted",
    });

    // Watch succeeded but ref is genuinely absent → missing
    const missing = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
      })
    );
    expect(missing.triggers[0].source).toEqual({ kind: "triggerRef", ref: "g", resolved: null, status: "missing" });
  });

  test("inline trigger without a template keeps template.status=resolved (no false missing badge)", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [{ name: "inline", interceptors: [], bindings: [], template: { ref: "" } }],
          },
        }),
        availability: { triggerTemplates: false },
      })
    );
    expect(result.triggers[0].template.ref).toBe("");
    expect(result.triggers[0].template.status).toBe("resolved");
  });
});

describe("buildTopology — pipelineRef classification", () => {
  test("templated with $(tt.params.X) extracts sourceParam", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "tpl" } });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        triggerTemplatesByName: new Map([["tpl", tt("tpl", "$(tt.params.pipelineName)")]]),
      })
    );
    expect(result.triggers[0].template.pipelineRef).toEqual({
      kind: "templated",
      raw: "$(tt.params.pipelineName)",
      sourceParam: "pipelineName",
    });
  });
  test("body interpolation has sourceParam=null", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "tpl" } });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        triggerTemplatesByName: new Map([["tpl", tt("tpl", "$(body.repository.name)-build")]]),
      })
    );
    expect(result.triggers[0].template.pipelineRef).toEqual({
      kind: "templated",
      raw: "$(body.repository.name)-build",
      sourceParam: null,
    });
  });
  test("missing resourcetemplates yields unknown", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "tpl" } });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        triggerTemplatesByName: new Map([["tpl", tt("tpl", undefined, false)]]),
      })
    );
    expect(result.triggers[0].template.pipelineRef).toEqual({ kind: "unknown" });
  });
});

describe("buildTopology — GitServer resolution", () => {
  test("absent label → gitServer=null", () => {
    const result = buildTopology(args());
    expect(result.gitServer).toBeNull();
  });
  test("label present but no matching CR → gitServer=null", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          metadata: {
            name: elName,
            namespace: ns,
            uid: "u",
            creationTimestamp: "2025-01-01T00:00:00Z",
            labels: { "app.edp.epam.com/gitServer": "github-1" },
          },
        }),
      })
    );
    expect(result.gitServer).toBeNull();
  });
  test("label + matching CR in same namespace → resolved", () => {
    const gs = makeGS("github-1");
    const result = buildTopology(
      args({
        eventListener: baseEL({
          metadata: {
            name: elName,
            namespace: ns,
            uid: "u",
            creationTimestamp: "2025-01-01T00:00:00Z",
            labels: { "app.edp.epam.com/gitServer": "github-1" },
          },
        }),
        gitServersByName: new Map([["github-1", gs]]),
      })
    );
    expect(result.gitServer?.metadata.name).toBe("github-1");
  });
});

describe("buildTopology — labelSelector union", () => {
  test("no labelSelector → output identical to today (regression guard)", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    const withoutSelector = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
      })
    );
    const withEmptyMatchLabels = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }], labelSelector: { matchLabels: {} } } }),
        triggersByName: new Map([["g", trig]]),
      })
    );
    expect(withEmptyMatchLabels.triggers).toEqual(withoutSelector.triggers);
    expect(withoutSelector.triggers[0].firesTwice).toBeUndefined();
  });

  test("Trigger CR matched only via labelSelector appears as an additional labelSelector-sourced node", () => {
    const listed = triggerCR("listed", { interceptors: [], bindings: [], template: { ref: "" } });
    const labelOnly = triggerCR("label-only", { interceptors: [], bindings: [], template: { ref: "" } });
    labelOnly.metadata.labels = { "app.edp.epam.com/gitServer": "gitlab" };
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [{ triggerRef: "listed" }],
            labelSelector: { matchLabels: { "app.edp.epam.com/gitServer": "gitlab" } },
          },
        }),
        triggersByName: new Map([
          ["listed", listed],
          ["label-only", labelOnly],
        ]),
      })
    );
    expect(result.triggers).toHaveLength(2);
    expect(result.triggers[0].source).toMatchObject({ kind: "triggerRef", ref: "listed" });
    expect(result.triggers[0].firesTwice).toBeUndefined();
    expect(result.triggers[1].source).toEqual({
      kind: "labelSelector",
      name: "label-only",
      matchedTerms: ["app.edp.epam.com/gitServer=gitlab"],
      resolved: labelOnly,
    });
    expect(result.triggerSelection).toMatchObject({ listedCount: 1, labelMatchedCount: 1, gaps: [] });
  });

  test("Trigger CR both listed AND label-matched dedups to a single flagged node", () => {
    const both = triggerCR("both", { interceptors: [], bindings: [], template: { ref: "" } });
    both.metadata.labels = { "app.edp.epam.com/gitServer": "gitlab" };
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [{ triggerRef: "both" }],
            labelSelector: { matchLabels: { "app.edp.epam.com/gitServer": "gitlab" } },
          },
        }),
        triggersByName: new Map([["both", both]]),
      })
    );
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].source).toMatchObject({ kind: "triggerRef", ref: "both" });
    expect(result.triggers[0].firesTwice).toBe(true);
  });

  test("matchLabels requires ALL pairs to match — a Trigger with only a subset of labels is excluded", () => {
    const partial = triggerCR("partial", { interceptors: [], bindings: [], template: { ref: "" } });
    partial.metadata.labels = { "app.edp.epam.com/gitServer": "gitlab" };
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: {
            triggers: [],
            labelSelector: {
              matchLabels: { "app.edp.epam.com/gitServer": "gitlab", "app.edp.epam.com/pipelinetype": "build" },
            },
          },
        }),
        triggersByName: new Map([["partial", partial]]),
      })
    );
    expect(result.triggers).toHaveLength(0);
  });
});

describe("buildTopology — labelSelector matchExpressions", () => {
  const withLabels = (name: string, labels: Record<string, string>) => {
    const trigger = triggerCR(name, { interceptors: [], bindings: [], template: { ref: "" } });
    trigger.metadata.labels = labels;
    return trigger;
  };

  const selectorEL = (labelSelector: object) => baseEL({ spec: { triggers: [], labelSelector } });

  const matchedNames = (labelSelector: object, triggers: ReturnType<typeof withLabels>[]) =>
    buildTopology(
      args({
        eventListener: selectorEL(labelSelector),
        triggersByName: new Map(triggers.map((t) => [t.metadata.name, t])),
      })
    ).triggers.map((t) => t.source.kind === "labelSelector" && t.source.name);

  test("In / NotIn / Exists / DoesNotExist are evaluated with Kubernetes semantics", () => {
    const build = withLabels("build", { type: "build" });
    const review = withLabels("review", { type: "review" });
    const unlabelled = withLabels("unlabelled", {});

    expect(matchedNames({ matchExpressions: [{ key: "type", operator: "In", values: ["build"] }] }, [build, review])) //
      .toEqual(["build"]);
    expect(
      matchedNames({ matchExpressions: [{ key: "type", operator: "NotIn", values: ["build"] }] }, [build, review])
    ).toEqual(["review"]);
    expect(matchedNames({ matchExpressions: [{ key: "type", operator: "Exists" }] }, [build, unlabelled])).toEqual([
      "build",
    ]);
    expect(
      matchedNames({ matchExpressions: [{ key: "type", operator: "DoesNotExist" }] }, [build, unlabelled])
    ).toEqual(["unlabelled"]);
  });

  test("matchLabels and matchExpressions are ANDed — passing only one is not enough", () => {
    const both = withLabels("both", { app: "el", type: "build" });
    const labelsOnly = withLabels("labels-only", { app: "el", type: "review" });
    expect(
      matchedNames(
        { matchLabels: { app: "el" }, matchExpressions: [{ key: "type", operator: "In", values: ["build"] }] },
        [both, labelsOnly]
      )
    ).toEqual(["both"]);
  });

  test("matchExpressions alone activates label selection (no matchLabels present)", () => {
    const result = buildTopology(
      args({
        eventListener: selectorEL({ matchExpressions: [{ key: "type", operator: "Exists" }] }),
        triggersByName: new Map([["build", withLabels("build", { type: "build" })]]),
      })
    );
    expect(result.triggers).toHaveLength(1);
    expect(result.triggerSelection).toMatchObject({ labelSelectorActive: true, terms: ["type"], gaps: [] });
  });

  test("an operator this client cannot evaluate excludes the Trigger and is reported as a gap", () => {
    const result = buildTopology(
      args({
        eventListener: selectorEL({ matchExpressions: [{ key: "type", operator: "GreaterThan", values: ["1"] }] }),
        triggersByName: new Map([["build", withLabels("build", { type: "build" })]]),
      })
    );
    expect(result.triggers).toHaveLength(0);
    expect(result.triggerSelection.gaps).toEqual([{ kind: "unsupportedOperators", operators: ["GreaterThan"] }]);
  });

  test("a malformed matchExpressions entry is skipped rather than throwing", () => {
    const result = buildTopology(
      args({
        eventListener: selectorEL({ matchLabels: { type: "build" }, matchExpressions: [{}, null, "nonsense"] }),
        triggersByName: new Map([["build", withLabels("build", { type: "build" })]]),
      })
    );
    expect(result.triggers).toHaveLength(1);
    expect(result.triggerSelection.terms).toEqual(["type=build"]);
  });
});

describe("buildTopology — selection gaps", () => {
  test("an errored Trigger watch is reported as restricted rather than silently matching nothing", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [], labelSelector: { matchLabels: { app: "el" } } } }),
        triggersByName: new Map(),
        availability: { triggers: false },
      })
    );
    expect(result.triggers).toHaveLength(0);
    expect(result.triggerSelection.gaps).toEqual([{ kind: "triggersRestricted" }]);
  });

  test("no restricted gap is reported when the EventListener has no label selector at all", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [] } }),
        availability: { triggers: false },
      })
    );
    expect(result.triggerSelection.gaps).toEqual([]);
  });

  test("namespaceSelector reaching other namespaces is reported, the EventListener's own namespace is not", () => {
    const result = buildTopology(
      args({
        eventListener: baseEL({
          spec: { triggers: [], namespaceSelector: { matchNames: [ns, "other-a", "other-b", "other-a"] } },
        }),
      })
    );
    expect(result.triggerSelection.gaps).toEqual([{ kind: "otherNamespaces", namespaces: ["other-a", "other-b"] }]);
  });

  test("namespaceSelector listing only the EventListener's own namespace is not a gap", () => {
    const result = buildTopology(
      args({ eventListener: baseEL({ spec: { triggers: [], namespaceSelector: { matchNames: [ns] } } }) })
    );
    expect(result.triggerSelection.gaps).toEqual([]);
  });
});

describe("buildTopology — degenerate EventListener specs", () => {
  test("an EventListener with no spec at all builds an empty topology", () => {
    const el = eventListenerSchema.parse({
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "EventListener",
      metadata: { name: elName, namespace: ns, uid: "u-el", creationTimestamp: "2025-01-01T00:00:00Z" },
    });
    const result = buildTopology(args({ eventListener: el }));
    expect(result.triggers).toEqual([]);
    expect(result.triggerSelection).toEqual({
      labelSelectorActive: false,
      terms: [],
      listedCount: 0,
      labelMatchedCount: 0,
      gaps: [],
    });
  });

  test("a labelSelector-only EventListener (no spec.triggers) still resolves its matched Triggers", () => {
    const labelled = triggerCR("labelled", { interceptors: [], bindings: [{ ref: "b" }], template: { ref: "t" } });
    labelled.metadata.labels = { app: "el" };
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { labelSelector: { matchLabels: { app: "el" } } } }),
        triggersByName: new Map([["labelled", labelled]]),
        triggerBindingsByName: new Map([["b", tb("b")]]),
        triggerTemplatesByName: new Map([["t", tt("t", "build-pipeline")]]),
      })
    );
    expect(result.triggers).toHaveLength(1);
    expect(result.triggers[0].bindings[0]).toMatchObject({ ref: "b", status: "resolved" });
    expect(result.triggers[0].template.pipelineRef).toEqual({ kind: "literal", pipelineName: "build-pipeline" });
    expect(result.triggerSelection).toMatchObject({ listedCount: 0, labelMatchedCount: 1 });
  });

  // Tekton stores an omitted interceptors/bindings list as an explicit `null`,
  // which a default parameter would hand straight to `.map`.
  test("a Trigger CR with null bindings/interceptors resolves to empty lists", () => {
    const nulled = triggerSchema.parse({
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "Trigger",
      metadata: {
        name: "nulled",
        namespace: ns,
        uid: "u-nulled",
        creationTimestamp: "2025-01-01T00:00:00Z",
        labels: { app: "el" },
      },
      spec: { bindings: null, interceptors: null, template: { ref: "t" } },
    });
    const viaLabel = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [], labelSelector: { matchLabels: { app: "el" } } } }),
        triggersByName: new Map([["nulled", nulled]]),
        triggerTemplatesByName: new Map([["t", tt("t", "p")]]),
      })
    );
    expect(viaLabel.triggers[0]).toMatchObject({ interceptors: [], bindings: [] });

    const viaRef = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "nulled" }] } }),
        triggersByName: new Map([["nulled", nulled]]),
      })
    );
    expect(viaRef.triggers[0]).toMatchObject({ interceptors: [], bindings: [] });
  });

  test("an EventListener with null spec.triggers is treated as having none", () => {
    const result = buildTopology(args({ eventListener: baseEL({ spec: { triggers: null } }) }));
    expect(result.triggers).toEqual([]);
    expect(result.triggerSelection.listedCount).toBe(0);
  });

  test("a label-matched Trigger CR with no spec resolves to empty interceptors/bindings", () => {
    const bare = triggerSchema.parse({
      apiVersion: "triggers.tekton.dev/v1beta1",
      kind: "Trigger",
      metadata: {
        name: "bare",
        namespace: ns,
        uid: "u-bare",
        creationTimestamp: "2025-01-01T00:00:00Z",
        labels: { app: "el" },
      },
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [], labelSelector: { matchLabels: { app: "el" } } } }),
        triggersByName: new Map([["bare", bare]]),
      })
    );
    expect(result.triggers[0]).toMatchObject({
      interceptors: [],
      bindings: [],
      template: { ref: "", status: "resolved" },
    });
  });
});

describe("buildTopology — latestPipelineRun selection", () => {
  test("no labeled runs → null", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
      })
    );
    expect(result.triggers[0].latestPipelineRun).toBeNull();
  });
  test("returns the labeled run when one exists", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    const olderRun = makePR("old", "2025-01-01T00:00:00Z", {
      "triggers.tekton.dev/eventlistener": elName,
      "triggers.tekton.dev/trigger": "g",
    });
    const newerRun = makePR("new", "2025-01-02T00:00:00Z", {
      "triggers.tekton.dev/eventlistener": elName,
      "triggers.tekton.dev/trigger": "g",
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [olderRun, newerRun],
      })
    );
    expect(result.triggers[0].latestPipelineRun?.metadata.name).toBe("new");
  });
  test("returns null when no run is labeled for this trigger (no cross-trigger leak)", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    const otherTriggerRun = makePR("other", "2025-01-02T00:00:00Z", {
      "triggers.tekton.dev/eventlistener": elName,
      "triggers.tekton.dev/trigger": "h",
    });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [otherTriggerRun],
      })
    );
    expect(result.triggers[0].latestPipelineRun).toBeNull();
  });
  test("picks the most recent labeled run when multiple match", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    const older = makePR("old", "2025-01-01T00:00:00Z", { "triggers.tekton.dev/trigger": "g" });
    const newer = makePR("new", "2025-01-03T00:00:00Z", { "triggers.tekton.dev/trigger": "g" });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [older, newer],
      })
    );
    expect(result.triggers[0].latestPipelineRun?.metadata.name).toBe("new");
  });

  test("orders by completionTime, not creationTimestamp", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    // The "new-creation" run was queued later (creationTimestamp newer) but
    // finished earlier; the older-queued "completed-later" run actually finished
    // most recently and must win.
    const completedLater = makePR(
      "completed-later",
      "2025-01-01T00:00:00Z",
      { "triggers.tekton.dev/trigger": "g" },
      { startTime: "2025-01-01T00:01:00Z", completionTime: "2025-01-03T00:10:00Z" }
    );
    const newCreation = makePR(
      "new-creation",
      "2025-01-02T00:00:00Z",
      { "triggers.tekton.dev/trigger": "g" },
      { startTime: "2025-01-02T00:01:00Z", completionTime: "2025-01-02T00:02:00Z" }
    );
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [newCreation, completedLater],
      })
    );
    expect(result.triggers[0].latestPipelineRun?.metadata.name).toBe("completed-later");
  });

  test("falls back to startTime for in-progress runs (no completionTime)", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    // Both runs are in-progress (no completionTime). The one that started later
    // wins, even when its creationTimestamp is identical.
    const startedEarlier = makePR(
      "started-earlier",
      "2025-01-01T00:00:00Z",
      { "triggers.tekton.dev/trigger": "g" },
      { startTime: "2025-01-01T00:01:00Z" }
    );
    const startedLater = makePR(
      "started-later",
      "2025-01-01T00:00:00Z",
      { "triggers.tekton.dev/trigger": "g" },
      { startTime: "2025-01-01T05:00:00Z" }
    );
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [startedEarlier, startedLater],
      })
    );
    expect(result.triggers[0].latestPipelineRun?.metadata.name).toBe("started-later");
  });

  test("falls back to creationTimestamp when neither startTime nor completionTime is set", () => {
    const trig = triggerCR("g", { interceptors: [], bindings: [], template: { ref: "" } });
    // Pending runs (PipelineRunPending) carry no startTime — fall back to creation order.
    const earlierPending = makePR("earlier-pending", "2025-01-01T00:00:00Z", { "triggers.tekton.dev/trigger": "g" });
    const laterPending = makePR("later-pending", "2025-01-02T00:00:00Z", { "triggers.tekton.dev/trigger": "g" });
    const result = buildTopology(
      args({
        eventListener: baseEL({ spec: { triggers: [{ triggerRef: "g" }] } }),
        triggersByName: new Map([["g", trig]]),
        recentRuns: [laterPending, earlierPending],
      })
    );
    expect(result.triggers[0].latestPipelineRun?.metadata.name).toBe("later-pending");
  });
});
