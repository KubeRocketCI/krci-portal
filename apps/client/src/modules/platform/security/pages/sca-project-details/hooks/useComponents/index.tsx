import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

interface UseComponentsParams {
  uuid: string;
  pageNumber?: number;
  pageSize?: number;
  sortName?: string;
  sortOrder?: "asc" | "desc";
  onlyOutdated?: boolean;
  onlyDirect?: boolean;
}

/**
 * Hook to fetch components for a project from Dependency Track
 * @param params - Query parameters including UUID, pagination, sorting, and filtering
 */
export function useComponents(params: UseComponentsParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "components", params],
    queryFn: () => trpc.dependencyTrack.getComponents.query(params),
    enabled: !!params.uuid,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}
