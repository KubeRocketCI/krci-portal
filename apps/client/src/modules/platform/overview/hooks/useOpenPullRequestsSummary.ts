import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";

import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";

export function useOpenPullRequestsSummary() {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  return useQuery({
    queryKey: ["gitfusion", "openPullRequestsSummary", clusterName, defaultNamespace],
    queryFn: () =>
      trpc.gitfusion.getOpenPullRequestsSummary.query({
        clusterName,
        namespace: defaultNamespace,
      }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
