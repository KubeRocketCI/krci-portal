import { useMemo, ReactNode } from "react";
import { LayoutDashboard, AlertCircle, LucideIcon } from "lucide-react";
import { ProjectWithMetrics } from "@my-project/shared";
import { MetricsGrid } from "../components/MetricsGrid";
import { QualityGateDetails } from "../components/QualityGateDetails";
import { IssuesSection } from "../components/IssuesSection";

/**
 * Badge configuration for tabs
 */
export interface TabBadge {
  value: number;
  variant: "secondary" | "default" | "destructive";
  className?: string;
}

/**
 * Tab definition for the SAST project details page
 */
export interface SASTProjectTab {
  id: string;
  label: string;
  icon: LucideIcon;
  badges?: TabBadge[];
  content: ReactNode;
}

interface UseTabsParams {
  projectKey: string;
  project: ProjectWithMetrics | null | undefined;
  isLoading: boolean;
}

/**
 * Hook to define tabs for the SAST Project Details page
 */
export function useTabs({ projectKey, project, isLoading }: UseTabsParams): SASTProjectTab[] {
  const measures = project?.measures;

  // Calculate total issues count for badge
  const totalIssues = useMemo(() => {
    if (!measures) return 0;
    const bugs = parseInt(measures.bugs || "0", 10) || 0;
    const vulnerabilities = parseInt(measures.vulnerabilities || "0", 10) || 0;
    const codeSmells = parseInt(measures.code_smells || "0", 10) || 0;
    return bugs + vulnerabilities + codeSmells;
  }, [measures]);

  return useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        icon: LayoutDashboard,
        content: (
          <div className="space-y-6">
            <MetricsGrid project={project} isLoading={isLoading} />
            {project && <QualityGateDetails projectKey={project.key} />}
          </div>
        ),
      },
      {
        id: "issues",
        label: "Issues",
        icon: AlertCircle,
        badges: [{ value: totalIssues, variant: "secondary" }],
        content: project ? <IssuesSection projectKey={projectKey} /> : null,
      },
    ],
    [project, projectKey, isLoading, totalIssues]
  );
}
