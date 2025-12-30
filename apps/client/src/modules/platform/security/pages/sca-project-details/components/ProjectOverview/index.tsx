import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/core/components/ui/card";
import { SeverityCallout } from "../SeverityCallout";
import { PolicyViolationClassification } from "../PolicyViolationClassification";
import { VulnerabilityTrendChart } from "@/modules/platform/security/pages/sca/components/shared/VulnerabilityTrendChart";
import { PolicyViolationsStateChart } from "@/modules/platform/security/pages/sca/components/shared/PolicyViolationsStateChart";
import { ComponentsChart } from "../ComponentsChart";
import { AuditingProgressChart } from "../AuditingProgressChart";
import { formatUnixTimestamp } from "@/core/utils/date-humanize";
import { DependencyTrackProject, PortfolioMetrics } from "@my-project/shared";

interface ProjectOverviewProps {
  project: DependencyTrackProject | undefined;
  metrics: PortfolioMetrics[] | undefined;
  isMetricsLoading: boolean;
}

export function ProjectOverview({ project, metrics, isMetricsLoading }: ProjectOverviewProps) {
  // Get the latest metrics for the callouts
  const latestMetric = metrics && metrics.length > 0 ? metrics[metrics.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Project Vulnerabilities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>Project Vulnerabilities</CardTitle>
              <div className="text-muted-foreground space-y-1 text-sm">
                {project?.lastBomImport && (
                  <div>
                    <span className="font-medium">Last BOM Import:</span> {formatUnixTimestamp(project.lastBomImport)}
                  </div>
                )}
                {project?.lastVulnerabilityAnalysis && (
                  <div>
                    <span className="font-medium">Last Vulnerability Analysis:</span>{" "}
                    {formatUnixTimestamp(project.lastVulnerabilityAnalysis)}
                  </div>
                )}
                {latestMetric && (
                  <div>
                    <span className="font-medium">Last Measurement:</span>{" "}
                    {formatUnixTimestamp(latestMetric.lastOccurrence)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <VulnerabilityTrendChart metrics={metrics} isLoading={isMetricsLoading} />
        </CardContent>

        <CardFooter className="border-t pt-6">
          {/* Severity Callouts Grid - 3 columns x 2 rows */}
          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Column 1 */}
            <div className="grid grid-cols-2 gap-4">
              <SeverityCallout severity="critical" label="Critical" value={latestMetric?.critical || 0} />
              <SeverityCallout severity="high" label="High" value={latestMetric?.high || 0} />
            </div>

            {/* Column 2 */}
            <div className="grid grid-cols-2 gap-4">
              <SeverityCallout severity="medium" label="Medium" value={latestMetric?.medium || 0} />
              <SeverityCallout severity="low" label="Low" value={latestMetric?.low || 0} />
            </div>

            {/* Column 3 */}
            <div className="grid grid-cols-2 gap-4">
              <SeverityCallout severity="unassigned" label="Unassigned" value={latestMetric?.unassigned || 0} />
              <SeverityCallout severity="riskScore" label="Risk Score" value={latestMetric?.inheritedRiskScore || 0} />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Two-column grid for charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Policy Violations - State */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Violations</CardTitle>
            <p className="text-muted-foreground text-sm">by State</p>
          </CardHeader>
          <CardContent>
            <PolicyViolationsStateChart metrics={metrics} isLoading={isMetricsLoading} />
          </CardContent>
        </Card>

        {/* Policy Violations - Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Violations</CardTitle>
            <p className="text-muted-foreground text-sm">by Classification</p>
          </CardHeader>
          <CardContent>
            <PolicyViolationClassification metrics={latestMetric} />
          </CardContent>
        </Card>
      </div>

      {/* Second row - Components and Auditing Progress */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Components */}
        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ComponentsChart metrics={metrics} isLoading={isMetricsLoading} />
          </CardContent>
        </Card>

        {/* Auditing Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Auditing Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditingProgressChart metrics={metrics} isLoading={isMetricsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
