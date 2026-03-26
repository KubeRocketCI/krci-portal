import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { Badge } from "@/core/components/ui/badge";
import { SecurityMetricCard } from "../../shared/SecurityMetricCard";
import { DependencyTrackMetricsList } from "../DependencyTrackMetricsList";
import { useDependencyTrackProject } from "./hooks/useDependencyTrackProject";
import { DependencyTrackMetricsWidgetProps } from "./types";
import { getRiskScoreBadgeVariant } from "./utils";
import { Link, useParams } from "@tanstack/react-router";
import { PATH_CONFIG_DEPENDENCY_TRACK_FULL } from "@/modules/platform/configuration/modules/dependency-track/route";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "@/modules/platform/security/pages/sca-project-details/route";
import { useClusterStore } from "@/k8s/store";

/**
 * DependencyTrack (SCA) metrics widget for Components page
 *
 * Displays dependency vulnerability metrics from DependencyTrack in a card layout:
 * - Risk score badge
 * - 5 severity badges (Critical, High, Medium, Low, Unassigned)
 * - "View Details" link to internal SCA project page (requires UUID from API)
 * - Empty state with configuration link when no data available
 *
 * Searches for exact match using projectName + defaultBranch to ensure
 * we show metrics for the correct branch when multiple versions exist.
 *
 * Uses pure TRPC approach.
 *
 * @example
 * <DependencyTrackMetricsWidget
 *   projectName="my-service"
 *   defaultBranch="main"
 * />
 */
export function DependencyTrackMetricsWidget({ projectName, defaultBranch }: DependencyTrackMetricsWidgetProps) {
  const { data, isLoading, error } = useDependencyTrackProject({
    projectName,
    defaultBranch,
  });
  const params = useParams({ strict: false });
  const clusterName = useClusterStore((state) => state.clusterName);

  const riskScore = data?.metrics?.inheritedRiskScore || 0;
  const projectUuid = data?.uuid;

  return (
    <SecurityMetricCard
      title="Dependencies"
      badge={
        <>
          {data && <Badge variant={getRiskScoreBadgeVariant(riskScore)}>Risk Score: {riskScore.toFixed(1)}</Badge>}
          <LearnMoreLink url={EDP_OPERATOR_GUIDE.DEPENDENCY_TRACK.url} />
        </>
      }
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyStateMessage={
        <p className="text-muted-foreground text-sm">
          No metrics available.{" "}
          <Link
            to={PATH_CONFIG_DEPENDENCY_TRACK_FULL}
            params={{ clusterName }}
            className="hover:text-foreground underline"
          >
            Set up DependencyTrack configuration
          </Link>{" "}
          and enable reporting in your pipeline.
        </p>
      }
      detailsLink={
        projectUuid && params.namespace
          ? {
              to: PATH_SCA_PROJECT_DETAILS_FULL,
              params: {
                clusterName,
                namespace: params.namespace,
                projectUuid,
              },
            }
          : undefined
      }
    >
      <DependencyTrackMetricsList metrics={data?.metrics} />
    </SecurityMetricCard>
  );
}
