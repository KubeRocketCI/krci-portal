import {
  Trigger,
  TriggerBinding,
  TriggerTemplate,
  Interceptor,
  ClusterInterceptor,
  GitServer,
  PipelineRun,
  eventListenerLabels,
} from "@my-project/shared";
import {
  BuildTopologyArgs,
  EventListenerTopology,
  PipelineRefShape,
  ResolutionStatus,
  ResolvedBindingRef,
  ResolvedInterceptorRef,
  ResolvedTriggerNode,
} from "./types";

const PR_TRIGGER_LABEL = "triggers.tekton.dev/trigger";

type TriggerEntry = NonNullable<Trigger["spec"]>;

export const classifyPipelineRef = (raw: string | undefined): PipelineRefShape => {
  if (!raw) return { kind: "unknown" };
  const ttParam = raw.match(/^\$\(tt\.params\.([^)]+)\)$/);
  if (ttParam) return { kind: "templated", raw, sourceParam: ttParam[1] };
  if (/\$\(.+?\)/.test(raw)) return { kind: "templated", raw, sourceParam: null };
  return { kind: "literal", pipelineName: raw };
};

const readPipelineRefName = (template: TriggerTemplate | null): string | undefined =>
  template?.spec?.resourcetemplates?.[0]?.spec?.pipelineRef?.name;

const statusFor = (resolved: object | null, available: boolean): ResolutionStatus =>
  resolved ? "resolved" : available ? "missing" : "restricted";

const resolveInterceptors = (
  raw: TriggerEntry["interceptors"] = [],
  interceptorsByName: Map<string, Interceptor>,
  clusterInterceptorsByName: Map<string, ClusterInterceptor>,
  interceptorsAvailable: boolean,
  clusterInterceptorsAvailable: boolean
): ResolvedInterceptorRef[] =>
  raw.map((i) => {
    const kind = i.ref?.kind === "ClusterInterceptor" ? "ClusterInterceptor" : "NamespacedInterceptor";
    const name = i.ref?.name ?? "";
    const resolved =
      kind === "ClusterInterceptor"
        ? (clusterInterceptorsByName.get(name) ?? null)
        : (interceptorsByName.get(name) ?? null);
    const available = kind === "ClusterInterceptor" ? clusterInterceptorsAvailable : interceptorsAvailable;
    return {
      ref: { name, kind },
      resolved,
      status: statusFor(resolved, available),
      params: (i.params ?? []) as { name: string; value: unknown }[],
    };
  });

const resolveBindings = (
  raw: TriggerEntry["bindings"] = [],
  triggerBindingsByName: Map<string, TriggerBinding>,
  triggerBindingsAvailable: boolean
): ResolvedBindingRef[] =>
  raw.map((b) => {
    const kind = b.kind === "ClusterTriggerBinding" ? "ClusterTriggerBinding" : "TriggerBinding";
    const ref = b.ref ?? "";
    // ClusterTriggerBinding is intentionally not watched in MVP. We cannot
    // prove absence, so report "restricted" (= "we cannot determine presence")
    // rather than "missing". The binding node still renders a CTB-specific
    // copy that takes precedence over the generic restricted badge.
    if (kind === "ClusterTriggerBinding") {
      return { ref, kind, resolved: null, status: "restricted" };
    }
    const resolved = triggerBindingsByName.get(ref) ?? null;
    return { ref, kind, resolved, status: statusFor(resolved, triggerBindingsAvailable) };
  });

// "Latest" prefers the most relevant timestamp the run actually has:
//   completionTime > startTime > creationTimestamp.
// This avoids a fast re-trigger surfacing the older run (which would happen
// if we sorted purely by creationTimestamp), and keeps in-progress runs ranked
// by when they actually started rather than when the CR landed in etcd.
const runOrderTime = (run: PipelineRun): number => {
  const t = run.status?.completionTime ?? run.status?.startTime ?? run.metadata?.creationTimestamp ?? 0;
  return new Date(t).getTime();
};

const pickLatestRun = (recentRuns: PipelineRun[], triggerName: string | undefined): PipelineRun | null => {
  if (!triggerName) return null;
  const labeled = recentRuns.filter((r) => r.metadata?.labels?.[PR_TRIGGER_LABEL] === triggerName);
  if (labeled.length === 0) return null;
  return labeled.reduce((latest, r) => (runOrderTime(r) > runOrderTime(latest) ? r : latest), labeled[0]);
};

export const buildTopology = ({
  eventListener,
  triggersByName,
  triggerBindingsByName,
  triggerTemplatesByName,
  interceptorsByName,
  clusterInterceptorsByName,
  gitServersByName,
  recentRuns,
  availability,
}: BuildTopologyArgs): EventListenerTopology => {
  // Default every source to "available" so existing callers that pre-date the
  // restricted-aware UI keep their resolution semantics.
  const triggersAvailable = availability?.triggers ?? true;
  const triggerBindingsAvailable = availability?.triggerBindings ?? true;
  const triggerTemplatesAvailable = availability?.triggerTemplates ?? true;
  const interceptorsAvailable = availability?.interceptors ?? true;
  const clusterInterceptorsAvailable = availability?.clusterInterceptors ?? true;
  // GitSource status isn't surfaced today: the diagram only renders that node
  // when a GitServer actually resolves. `availability.gitServers` is accepted
  // for forward-compat with a future restricted-aware GitSource treatment.

  const status = eventListener.status;
  const address = status?.address?.url ?? null;
  const ready = status?.conditions?.find((c) => c.type === "Ready")?.status === "True";

  const gitServerName = eventListener.metadata.labels?.[eventListenerLabels.gitServer];
  const gitServer: GitServer | null = gitServerName ? (gitServersByName.get(gitServerName) ?? null) : null;

  const rawTriggers = eventListener.spec?.triggers ?? [];

  const resolveTemplate = (templateRef: string) => {
    const resolved = templateRef ? (triggerTemplatesByName.get(templateRef) ?? null) : null;
    return {
      ref: templateRef,
      resolved,
      // An empty templateRef is a structural "no template here", not an
      // unresolved cross-reference — keep it as "resolved" so the UI doesn't
      // light up a misleading badge for inline triggers without a template.
      status: !templateRef ? ("resolved" as const) : statusFor(resolved, triggerTemplatesAvailable),
      pipelineRef: classifyPipelineRef(readPipelineRefName(resolved)),
    };
  };

  const triggers: ResolvedTriggerNode[] = rawTriggers.map((entry) => {
    if (entry.triggerRef) {
      const resolvedTrigger = triggersByName.get(entry.triggerRef) ?? null;
      const triggerSpec = resolvedTrigger?.spec;
      const interceptors = resolveInterceptors(
        triggerSpec?.interceptors,
        interceptorsByName,
        clusterInterceptorsByName,
        interceptorsAvailable,
        clusterInterceptorsAvailable
      );
      const bindings = resolveBindings(triggerSpec?.bindings, triggerBindingsByName, triggerBindingsAvailable);
      const templateRef = triggerSpec?.template?.ref ?? "";
      return {
        source: {
          kind: "triggerRef" as const,
          ref: entry.triggerRef,
          resolved: resolvedTrigger,
          status: statusFor(resolvedTrigger, triggersAvailable),
        },
        interceptors,
        bindings,
        template: resolveTemplate(templateRef),
        latestPipelineRun: pickLatestRun(recentRuns, entry.triggerRef),
      };
    }
    const inlineName = entry.name ?? "";
    const interceptors = resolveInterceptors(
      entry.interceptors,
      interceptorsByName,
      clusterInterceptorsByName,
      interceptorsAvailable,
      clusterInterceptorsAvailable
    );
    const bindings = resolveBindings(entry.bindings, triggerBindingsByName, triggerBindingsAvailable);
    const templateRef = entry.template?.ref ?? "";
    return {
      source: { kind: "inline" as const, name: inlineName },
      interceptors,
      bindings,
      template: resolveTemplate(templateRef),
      latestPipelineRun: pickLatestRun(recentRuns, inlineName),
    };
  });

  return { eventListener, address, ready, gitServer, triggers };
};
