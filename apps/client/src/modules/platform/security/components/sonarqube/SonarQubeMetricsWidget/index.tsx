import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { QualityGateBadge } from "@/modules/platform/security/pages/sast/components/QualityGateBadge";
import { SecurityMetricCard } from "../../shared/SecurityMetricCard";
import { SonarQubeMetricsList } from "../SonarQubeMetricsList";
import { useSonarQubeProject } from "./hooks/useSonarQubeProject";
import { SonarQubeMetricsWidgetProps } from "./types";
import { Link } from "@tanstack/react-router";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { useClusterStore } from "@/k8s/store";

/**
 * SonarQube metrics widget for Components page
 *
 * Displays code quality metrics from SonarQube in a card layout:
 * - Quality gate badge
 * - 6 metric badges (Vulnerabilities, Bugs, Code Smells, Hotspots, Coverage, Duplications)
 * - Empty state with configuration link when no data available
 *
 * @example
 * <SonarQubeMetricsWidget componentKey="my-service" />
 */
export function SonarQubeMetricsWidget({ componentKey }: SonarQubeMetricsWidgetProps) {
  const { data, isLoading, error } = useSonarQubeProject({ componentKey });
  const clusterName = useClusterStore((state) => state.clusterName);

  return (
    <SecurityMetricCard
      title="Code Quality"
      badge={
        <>
          <QualityGateBadge status={data?.measures?.alert_status} />
          <LearnMoreLink url={EDP_OPERATOR_GUIDE.SONAR.url} />
        </>
      }
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyStateMessage={
        <p className="text-muted-foreground text-sm">
          No metrics available.{" "}
          <Link to={PATH_CONFIG_SONAR_FULL} params={{ clusterName }} className="hover:text-foreground underline">
            Set up SonarQube configuration
          </Link>{" "}
          and enable reporting in your pipeline.
        </p>
      }
    >
      <SonarQubeMetricsList measures={data?.measures} />
    </SecurityMetricCard>
  );
}
