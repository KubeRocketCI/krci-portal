import { useQuery } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import type { Codebase } from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { getBranchDiscoveryState } from "./state";

export function useBranchDiscovery(codebase: Codebase) {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const gitServerName = codebase.spec.gitServer;
  const gitUrlPath = codebase.spec.gitUrlPath;
  const repoName = gitUrlPath.split("/").at(-1) || "";
  const owner = gitUrlPath.split("/").filter(Boolean).slice(0, -1).join("/");

  const gitServerWatch = useGitServerWatchItem({ name: gitServerName });

  const state = getBranchDiscoveryState({
    gitServerName,
    owner,
    repoName,
    gitServer: gitServerWatch.data,
    isGitServerLoading: gitServerWatch.isLoading,
  });

  const query = useQuery({
    queryKey: ["branchList", gitServerName, owner, repoName],
    queryFn: () =>
      trpc.gitfusion.getBranchList.query({
        gitServer: gitServerName,
        owner,
        repoName,
        namespace: defaultNamespace,
        clusterName,
      }),
    enabled: state.isEnabled,
    staleTime: 0,
    refetchOnMount: true,
  });

  const isLoading = state.isGitServerPending || query.isLoading;

  const helperText = state.isGitServerUnavailable
    ? `Git Server ${gitServerName} is unavailable. Branches auto-discovery is disabled.`
    : state.isEnabled && query.isError
      ? "Branches auto-discovery could not be performed."
      : " ";

  return { ...state, isLoading, helperText, query };
}
