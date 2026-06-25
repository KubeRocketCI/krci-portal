import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { LoadingProgressBar } from "@/core/components/ui/LoadingProgressBar";
import { CriticalError } from "@/core/components/CriticalError";
import { useClusterStore } from "@/k8s/store";

export const ConfigProvider = ({ children }: React.PropsWithChildren) => {
  const trpc = trpcHttpClient;

  const clusterName = useClusterStore((state) => state.clusterName);
  const clusterNameResolved = useClusterStore((state) => state.clusterNameResolved);
  const setClusterName = useClusterStore((state) => state.setClusterName);
  const setDefaultNamespace = useClusterStore((state) => state.setDefaultNamespace);
  const setSonarWebUrl = useClusterStore((state) => state.setSonarWebUrl);
  const setDependencyTrackWebUrl = useClusterStore((state) => state.setDependencyTrackWebUrl);

  const configQuery = useQuery({
    queryKey: ["server.config"],
    queryFn: () => trpc.config.get.query(),
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (!configQuery.data) {
      return;
    }

    const { clusterName: serverClusterName, defaultNamespace, sonarWebUrl, dependencyTrackWebUrl } = configQuery.data;

    if (!clusterName) {
      setClusterName(serverClusterName);
    }

    // Reconcile AFTER setClusterName: that call synchronously hydrates defaultNamespace from
    // persisted cluster_settings, so a user-chosen namespace loads first and the guard preserves
    // it. Adopt the server default only when the store is still empty (e.g. a stale entry
    // persisted before the server had a namespace). setDefaultNamespace also repairs allowedNamespaces.
    if (defaultNamespace && !useClusterStore.getState().defaultNamespace) {
      setDefaultNamespace(defaultNamespace);
    }

    setSonarWebUrl(sonarWebUrl);
    setDependencyTrackWebUrl(dependencyTrackWebUrl);
  }, [configQuery.data, clusterName, setClusterName, setDefaultNamespace, setSonarWebUrl, setDependencyTrackWebUrl]);

  if (configQuery.isLoading && !configQuery.isError) {
    return <LoadingProgressBar />;
  }

  if (configQuery.isError) {
    return (
      <CriticalError
        title="Configuration Error"
        message="Failed to load server configuration. Please check your deployment environment variables."
        error={configQuery.error}
        onRetry={() => configQuery.refetch()}
        showActions={true}
      />
    );
  }

  if (!clusterNameResolved) {
    return <LoadingProgressBar />;
  }

  return <>{children}</>;
};
