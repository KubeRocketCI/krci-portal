import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch a single project from Dependency Track
 * @param uuid - Project UUID
 */
export function useProject(uuid: string) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "project", uuid],
    queryFn: () => trpc.dependencyTrack.getProject.query({ uuid }),
    enabled: !!uuid,
    staleTime: 30000, // 30 seconds
    retry: 1,
  });
}
