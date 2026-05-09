import React from "react";
import { PipelineRun } from "@my-project/shared";
import { useEventListenerWatchItem } from "@/k8s/api/groups/Tekton/EventListener";
import { useTriggerWatchList } from "@/k8s/api/groups/Tekton/Trigger";
import { useTriggerBindingWatchList } from "@/k8s/api/groups/Tekton/TriggerBinding";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useInterceptorWatchList } from "@/k8s/api/groups/Tekton/Interceptor";
import { useClusterInterceptorWatchList } from "@/k8s/api/groups/Tekton/ClusterInterceptor";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { usePipelineRunWatchList } from "@/k8s/api/groups/Tekton/PipelineRun";
import { buildTopology } from "./build";
import { EventListenerTopology } from "./types";

export { classifyPipelineRef } from "./build";

export type {
  EventListenerTopology,
  ResolvedTriggerNode,
  ResolvedInterceptorRef,
  ResolvedBindingRef,
  ResolutionStatus,
  PipelineRefShape,
} from "./types";

export interface UseEventListenerTopologyResult {
  isReady: boolean;
  data: EventListenerTopology | null;
  // Raw EL-scoped PipelineRuns surfaced for metrics (e.g. 24h run count).
  // The topology only retains the per-trigger latest run, so the full array
  // is exposed here to avoid a duplicate watch in consumers.
  recentRuns: PipelineRun[];
  recentRunsReady: boolean;
}

// A watch is "settled" once it has a definitive answer — success OR error. Treating
// permission denials / missing CRDs as settled (with empty data) keeps the page
// usable for users whose RBAC is narrower than cluster-admin: missing cross-refs
// resolve to null and render via the diagram's missing-ref fallback. Strict
// AND-of-isReady would deadlock the spinner on the first 4xx.
const isSettled = (w: { isReady: boolean; query: { isError: boolean } }): boolean => w.isReady || w.query.isError;

export function useEventListenerTopology({
  name,
  namespace,
}: {
  name: string;
  namespace: string;
}): UseEventListenerTopologyResult {
  const elWatch = useEventListenerWatchItem({ name, namespace });
  const triggersWatch = useTriggerWatchList({ namespace });
  const triggerBindingsWatch = useTriggerBindingWatchList({ namespace });
  const triggerTemplatesWatch = useTriggerTemplateWatchList({ namespace });
  const interceptorsWatch = useInterceptorWatchList({ namespace });
  const clusterInterceptorsWatch = useClusterInterceptorWatchList();
  const gitServersWatch = useGitServerWatchList({ namespace });
  const recentRunsWatch = usePipelineRunWatchList({
    namespace,
    labels: { "triggers.tekton.dev/eventlistener": name },
  });

  const allSettled =
    isSettled(elWatch) &&
    isSettled(triggersWatch) &&
    isSettled(triggerBindingsWatch) &&
    isSettled(triggerTemplatesWatch) &&
    isSettled(interceptorsWatch) &&
    isSettled(clusterInterceptorsWatch) &&
    isSettled(gitServersWatch) &&
    isSettled(recentRunsWatch);

  const isReady = allSettled && !!elWatch.data;

  // Per-watch availability flags — `false` when the underlying list/get
  // errored. The build step uses these to mark unresolved cross-refs as
  // "restricted" instead of the misleading "missing", so a non-admin user
  // isn't told that ClusterInterceptors they can't see don't exist.
  const triggersAvailable = !triggersWatch.query.isError;
  const triggerBindingsAvailable = !triggerBindingsWatch.query.isError;
  const triggerTemplatesAvailable = !triggerTemplatesWatch.query.isError;
  const interceptorsAvailable = !interceptorsWatch.query.isError;
  const clusterInterceptorsAvailable = !clusterInterceptorsWatch.query.isError;
  const gitServersAvailable = !gitServersWatch.query.isError;

  const data = React.useMemo<EventListenerTopology | null>(() => {
    if (!isReady || !elWatch.data) return null;
    return buildTopology({
      eventListener: elWatch.data,
      triggersByName: triggersWatch.data.map,
      triggerBindingsByName: triggerBindingsWatch.data.map,
      triggerTemplatesByName: triggerTemplatesWatch.data.map,
      interceptorsByName: interceptorsWatch.data.map,
      clusterInterceptorsByName: clusterInterceptorsWatch.data.map,
      gitServersByName: gitServersWatch.data.map,
      recentRuns: recentRunsWatch.data.array,
      availability: {
        triggers: triggersAvailable,
        triggerBindings: triggerBindingsAvailable,
        triggerTemplates: triggerTemplatesAvailable,
        interceptors: interceptorsAvailable,
        clusterInterceptors: clusterInterceptorsAvailable,
        gitServers: gitServersAvailable,
      },
    });
  }, [
    isReady,
    elWatch.data,
    triggersWatch.data.map,
    triggerBindingsWatch.data.map,
    triggerTemplatesWatch.data.map,
    interceptorsWatch.data.map,
    clusterInterceptorsWatch.data.map,
    gitServersWatch.data.map,
    recentRunsWatch.data.array,
    triggersAvailable,
    triggerBindingsAvailable,
    triggerTemplatesAvailable,
    interceptorsAvailable,
    clusterInterceptorsAvailable,
    gitServersAvailable,
  ]);

  return { isReady, data, recentRuns: recentRunsWatch.data.array, recentRunsReady: recentRunsWatch.isReady };
}
