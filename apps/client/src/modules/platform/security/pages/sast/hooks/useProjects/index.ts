import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { UseProjectsOptions } from "../../types";

/**
 * Hook to fetch SonarQube projects with metrics and quality gate status
 *
 * @param options - Query options
 * @returns Projects data and query state
 */
export const useProjects = (options: UseProjectsOptions = {}) => {
  const { page = 1, pageSize = 50, searchTerm, enabled = true } = options;
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube", "projects", { page, pageSize, searchTerm }],
    queryFn: () =>
      trpc.sonarqube.getProjects.query({
        page,
        pageSize,
        searchTerm,
      }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
