import { useDependencyTrackProject } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget/hooks/useDependencyTrackProject";
import { useProjectMetrics } from "@/modules/platform/security/pages/sca-project-details/hooks/useProjectMetrics";

/**
 * DependencyTrack project and its metrics time series for the Dependencies tab.
 * Called by the tab wrapper so the requests run while the content chunk loads. Import hook files only, no chart modules.
 */
export function useVulnerabilitiesTabData({
  codebaseName,
  defaultBranch,
}: {
  codebaseName: string;
  defaultBranch: string;
}) {
  const {
    data: project,
    isLoading,
    error,
  } = useDependencyTrackProject({
    projectName: codebaseName,
    defaultBranch,
  });

  const { data: portfolioMetrics, isLoading: isMetricsLoading } = useProjectMetrics(project?.uuid || "", 90);

  return { project, isLoading, error, portfolioMetrics, isMetricsLoading };
}

export type VulnerabilitiesTabData = ReturnType<typeof useVulnerabilitiesTabData>;
