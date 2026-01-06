import { useMemo } from "react";
import { useProjects } from "../../../sast/hooks/useProjects";

/**
 * Hook to get a single project by key from the projects list
 * Leverages existing getProjects query and filters by key
 */
export function useProject(projectKey: string) {

  // Use existing projects query - it's likely already cached
  const { data, isLoading, error } = useProjects({
    page: 1,
    pageSize: 500,
    searchTerm: "",
  });

  const project = useMemo(() => {
    if (!data?.projects) return undefined;
    return data.projects.find((p) => p.key === projectKey);
  }, [data?.projects, projectKey]);

  return {
    data: project,
    isLoading,
    error,
  };
}
