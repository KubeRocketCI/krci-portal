import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { IssuesQueryParams } from "@my-project/shared";

/**
 * Hook to fetch project issues with pagination and filtering
 *
 * @param params - Issues query parameters
 * @returns React Query result with issues data
 *
 * @example
 * const { data, isLoading, error } = useProjectIssues({
 *   componentKeys: "my-project",
 *   types: "BUG,VULNERABILITY",
 *   severities: "BLOCKER,CRITICAL",
 *   p: 1,
 *   ps: 25
 * });
 */
export function useProjectIssues(params: IssuesQueryParams) {
  const trpc = useTRPCClient();

  return useQuery({
    queryKey: ["sonarqube.issues", params],
    queryFn: () => trpc.sonarqube.getProjectIssues.query(params),
    enabled: Boolean(params.componentKeys),
  });
}
