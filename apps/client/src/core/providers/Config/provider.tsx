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
  const setAllowedNamespaces = useClusterStore((state) => state.setAllowedNamespaces);
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
    if (configQuery.data) {
      const { clusterName: serverClusterName, defaultNamespace, sonarWebUrl, dependencyTrackWebUrl } = configQuery.data;

      if (!clusterName) {
        setClusterName(serverClusterName);

        const settings = localStorage.getItem("cluster_settings");
        if (!settings || !JSON.parse(settings)[serverClusterName]) {
          setDefaultNamespace(defaultNamespace);
          setAllowedNamespaces([defaultNamespace]);
        }
      }

      setSonarWebUrl(sonarWebUrl);
      setDependencyTrackWebUrl(dependencyTrackWebUrl);
    }
  }, [
    configQuery.data,
    clusterName,
    setClusterName,
    setDefaultNamespace,
    setAllowedNamespaces,
    setSonarWebUrl,
    setDependencyTrackWebUrl,
  ]);

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
