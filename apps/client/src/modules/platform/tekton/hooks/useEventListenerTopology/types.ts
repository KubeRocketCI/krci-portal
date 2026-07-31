import {
  EventListener,
  Trigger,
  TriggerBinding,
  TriggerTemplate,
  Interceptor,
  ClusterInterceptor,
  GitServer,
  PipelineRun,
} from "@my-project/shared";

/**
 * Tri-state for cross-resource references in the topology:
 *   - "resolved":   the lookup succeeded and the target was found
 *   - "missing":    the lookup succeeded but the target does not exist (broken ref)
 *   - "restricted": the underlying watch errored (RBAC denial, missing CRD,
 *                   network) — we can't tell whether the target exists
 *
 * UI surfaces "restricted" with a different label/tooltip from "missing" so
 * non-admin users aren't told a perfectly valid resource is broken.
 */
export type ResolutionStatus = "resolved" | "missing" | "restricted";

export type ResolvedInterceptorRef = {
  ref: { name: string; kind: "NamespacedInterceptor" | "ClusterInterceptor" };
  resolved: Interceptor | ClusterInterceptor | null;
  status: ResolutionStatus;
  params: Array<{ name: string; value: unknown }>;
};

export type ResolvedBindingRef = {
  ref: string;
  kind: "TriggerBinding" | "ClusterTriggerBinding";
  resolved: TriggerBinding | null;
  status: ResolutionStatus;
};

export type PipelineRefShape =
  | { kind: "literal"; pipelineName: string }
  | { kind: "templated"; raw: string; sourceParam: string | null }
  | { kind: "unknown" };

export type ResolvedTriggerNode = {
  source:
    | { kind: "triggerRef"; ref: string; resolved: Trigger | null; status: ResolutionStatus }
    | { kind: "inline"; name: string }
    // Discovered by matching spec.labelSelector against the namespace's Trigger
    // CRs, so unlike a triggerRef this one cannot be unresolved.
    | { kind: "labelSelector"; name: string; matchedTerms: string[]; resolved: Trigger };
  interceptors: ResolvedInterceptorRef[];
  bindings: ResolvedBindingRef[];
  template: {
    ref: string;
    resolved: TriggerTemplate | null;
    status: ResolutionStatus;
    pipelineRef: PipelineRefShape;
  };
  latestPipelineRun: PipelineRun | null;
  /**
   * True when this Trigger is both listed in spec.triggers AND matched by
   * spec.labelSelector — Tekton's sink fires it twice per event, a
   * misconfiguration the UI flags rather than hiding behind a single node.
   */
  firesTwice?: boolean;
};

/**
 * A reason the label-matched Trigger set the UI shows may be narrower than what
 * the Tekton sink actually serves, so an incomplete diagram is never mistaken
 * for a complete one.
 */
export type SelectionGap =
  | { kind: "triggersRestricted" }
  | { kind: "unsupportedOperators"; operators: string[] }
  | { kind: "otherNamespaces"; namespaces: string[] };

export type TriggerSelection = {
  labelSelectorActive: boolean;
  /** Selector terms in kubectl syntax, e.g. ["app=gitlab", "tier in (a, b)"]. */
  terms: string[];
  /** The "Triggers" number the list view shows; kept apart from the label-matched count so the two views cannot disagree. */
  listedCount: number;
  labelMatchedCount: number;
  gaps: SelectionGap[];
};

export type EventListenerTopology = {
  eventListener: EventListener;
  address: string | null;
  ready: boolean;
  gitServer: GitServer | null;
  triggers: ResolvedTriggerNode[];
  triggerSelection: TriggerSelection;
};

/**
 * Per-watch availability — `false` means the underlying list/get errored, so
 * an empty `*ByName` Map signals "couldn't load" rather than "the cluster
 * really has no such resources".
 *
 * Optional with a default of `true` per source so existing call sites and
 * tests that don't care about restricted state stay correct.
 */
export interface TopologyAvailability {
  triggers?: boolean;
  triggerBindings?: boolean;
  triggerTemplates?: boolean;
  interceptors?: boolean;
  clusterInterceptors?: boolean;
  gitServers?: boolean;
}

export interface BuildTopologyArgs {
  eventListener: EventListener;
  triggersByName: Map<string, Trigger>;
  triggerBindingsByName: Map<string, TriggerBinding>;
  triggerTemplatesByName: Map<string, TriggerTemplate>;
  interceptorsByName: Map<string, Interceptor>;
  clusterInterceptorsByName: Map<string, ClusterInterceptor>;
  gitServersByName: Map<string, GitServer>;
  recentRuns: PipelineRun[];
  availability?: TopologyAvailability;
}
