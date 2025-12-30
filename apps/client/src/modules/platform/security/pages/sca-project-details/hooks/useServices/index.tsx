import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseServicesParams {
  uuid: string;
  pageNumber?: number;
  pageSize?: number;
  sortName?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Hook to fetch services for a project from Dependency Track
 * @param params - Query parameters including UUID, pagination, and sorting
 */
export function useServices(params: UseServicesParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "services", params],
    queryFn: () => trpc.dependencyTrack.getServices.query(params),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
