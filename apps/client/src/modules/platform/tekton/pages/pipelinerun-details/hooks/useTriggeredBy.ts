import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { TriggeredBy } from "@my-project/shared";
import { useQuery } from "@tanstack/react-query";

/**
 * Resolves "Triggered By" (the krci-audit CREATE actor) for a PipelineRun by namespace/name,
 * which correlates both live runs and ones reconstructed from Tekton Results history.
 *
 * A resolved actor is immutable so it caches indefinitely; a `degraded` fallback (transient
 * krci-audit/RBAC failure) is kept stale and refetched on next mount so an outage doesn't pin "N/A".
 */
export function useTriggeredBy(
  namespace: string | undefined,
  name: string | undefined,
  enabled = true
): TriggeredBy | undefined {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((state) => state.clusterName);

  const { data } = useQuery({
    queryKey: ["krciAudit", "getTriggeredBy", clusterName, namespace, name],
    queryFn: () => trpc.krciAudit.getTriggeredBy.query({ namespace: namespace!, name: name! }),
    enabled: enabled && !!namespace && !!name,
    // Refetch degraded results (staleTime 0) on next mount; cache resolved actors forever.
    // refetchOnMount defaults to true, so the stale degraded entry refetches automatically.
    staleTime: (query) => (query.state.data?.degraded ? 0 : Infinity),
  });

  return data;
}
