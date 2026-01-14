import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch quality gate details with all conditions
 *
 * @param projectKey - SonarQube project key
 * @returns React Query result with quality gate data
 *
 * @example
 * const { data, isLoading, error } = useQualityGateDetails("my-project");
 */
export function useQualityGateDetails(projectKey: string) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube.qualityGate", projectKey],
    queryFn: () => trpc.sonarqube.getQualityGateDetails.query({ projectKey }),
    enabled: Boolean(projectKey),
  });
}
