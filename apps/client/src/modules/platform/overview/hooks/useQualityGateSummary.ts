import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

export function useQualityGateSummary() {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube", "qualityGateSummary"],
    queryFn: () => trpc.sonarqube.getQualityGateSummary.query(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: false,
  });
}
