import { useQuery } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { getK8sDeploymentRevisionsQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import type { RequestError } from "@/core/types/global";

interface Params {
  namespace: string;
  name: string;
}

export function useDeploymentRevisions({ namespace, name }: Params) {
  const trpc = useTRPCClient();
  const clusterName = useClusterStore((s) => s.clusterName);

  return useQuery<Awaited<ReturnType<typeof trpc.k8s.listDeploymentRevisions.query>>, RequestError>({
    queryKey: getK8sDeploymentRevisionsQueryCacheKey(clusterName, namespace, name),
    queryFn: () => trpc.k8s.listDeploymentRevisions.query({ namespace, name }),
    enabled: !!name && !!namespace,
    // The rollback dialog mounts on demand and must reflect the live revision list
    // (newly added or pruned ReplicaSets between dialog opens). staleTime:0 alone is not
    // enough: the global QueryClient sets refetchOnMount:false, and RollbackAction keeps this
    // query subscribed for the button state, so the dialog would otherwise show cached data.
    // refetchOnMount:"always" forces a fresh fetch every time the dialog mounts.
    staleTime: 0,
    refetchOnMount: "always",
  });
}
