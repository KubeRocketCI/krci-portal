import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";

export function useNamespaceResourceUsage() {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  return useQuery({
    queryKey: ["k8s", "namespaceResourceUsage", clusterName, defaultNamespace],
    queryFn: () =>
      trpc.k8s.getNamespaceResourceUsage.query({
        clusterName,
        namespace: defaultNamespace,
      }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
