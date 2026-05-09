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
    | { kind: "inline"; name: string };
  interceptors: ResolvedInterceptorRef[];
  bindings: ResolvedBindingRef[];
  template: {
    ref: string;
    resolved: TriggerTemplate | null;
    status: ResolutionStatus;
    pipelineRef: PipelineRefShape;
  };
  latestPipelineRun: PipelineRun | null;
};

export type EventListenerTopology = {
  eventListener: EventListener;
  address: string | null;
  ready: boolean;
  gitServer: GitServer | null;
  triggers: ResolvedTriggerNode[];
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
