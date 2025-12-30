import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";

export interface UseProjectsParams {
  pageNumber?: number;
  pageSize?: number;
  sortName?: string;
  sortOrder?: "asc" | "desc";
  excludeInactive?: boolean;
  onlyRoot?: boolean;
  tag?: string;
  classifier?: string;
  searchTerm?: string;
}

/**
 * Custom hook to fetch projects from Dependency Track
 *
 * @param params - Query parameters for filtering and pagination
 * @returns React Query result with projects data
 *
 * @example
 * const { data, isLoading } = useProjects({
 *   pageNumber: 0, // 0-indexed (backend converts to 1-indexed for DT API)
 *   pageSize: 25,
 *   excludeInactive: false
 * });
 */
export function useProjects(params: UseProjectsParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["dependencyTrack", "projects", params],
    queryFn: () => trpc.dependencyTrack.getProjects.query(params),
    staleTime: 30000, // 30 seconds
  });
}
