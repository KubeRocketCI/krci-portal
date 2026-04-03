import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { Shield, AlertTriangle, Package, FileWarning, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { PATH_CONFIG_DEPENDENCY_TRACK_FULL } from "@/modules/platform/configuration/modules/dependency-track/route";
import { PATH_SCA_PROJECT_DETAILS_FULL } from "@/modules/platform/security/pages/sca-project-details/route";
import { VulnerabilityTrendChart } from "@/modules/platform/security/pages/sca/components/shared/VulnerabilityTrendChart";
import { SeverityCallout } from "@/modules/platform/security/pages/sca-project-details/components/SeverityCallout";
import { useProjectMetrics } from "@/modules/platform/security/pages/sca-project-details/hooks/useProjectMetrics";
import { getRiskScoreBadgeVariant } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget/utils";
import { DependencyTrackMetricsList } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsList";
import { useDependencyTrackProject } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget/hooks/useDependencyTrackProject";
import { VulnerabilitiesTabProps } from "./types";

/**
 * Vulnerabilities Tab component for Codebase Details page
 *
 * Displays enhanced SCA (DependencyTrack) overview following the prototype design
 */
export function VulnerabilitiesTab({ codebaseName, defaultBranch, namespace, clusterName }: VulnerabilitiesTabProps) {
  const {
    data: project,
    isLoading,
    error,
  } = useDependencyTrackProject({
    projectName: codebaseName,
    defaultBranch,
  });

  const projectUuid = project?.uuid;

  const { data: portfolioMetrics, isLoading: isMetricsLoading } = useProjectMetrics(projectUuid || "", 90);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !project || !projectUuid) {
    return (
      <Alert>
        {error
          ? "Failed to load DependencyTrack data. Please try again later."
          : "No DependencyTrack data available for this project."}{" "}
        <Link
          to={PATH_CONFIG_DEPENDENCY_TRACK_FULL}
          params={{ clusterName }}
          className="hover:text-foreground underline"
        >
          Configure DependencyTrack integration
        </Link>{" "}
        and enable reporting in your pipeline to view vulnerability data.
      </Alert>
    );
  }

  const metrics = project.metrics;

  // Format timestamps
  const lastBomImport = project.lastBomImport ? new Date(project.lastBomImport).toLocaleString() : "Never";
  const lastMeasurement = metrics?.lastOccurrence ? new Date(metrics.lastOccurrence).toLocaleString() : "Never";

  return (
    <div className="space-y-8">
      {/* Vulnerability Summary */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield className="text-muted-foreground h-5 w-5" />
            <h4 className="text-foreground">Dependencies</h4>
          </div>
          <Badge variant={getRiskScoreBadgeVariant(metrics?.inheritedRiskScore || 0)}>
            Risk Score: {(metrics?.inheritedRiskScore || 0).toFixed(1)}
          </Badge>

          <DependencyTrackMetricsList metrics={metrics} />

          <div className="ml-auto">
            <Button asChild variant="outline">
              <Link to={PATH_SCA_PROJECT_DETAILS_FULL} params={{ clusterName, namespace, projectUuid }}>
                Open Details Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Project Vulnerabilities Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-slate-900">Project Vulnerabilities</h3>
            <div className="flex gap-6 text-sm text-slate-600">
              <div>
                Last BOM Import: <span className="text-slate-900">{lastBomImport}</span>
              </div>
              <div>
                Last Measurement: <span className="text-slate-900">{lastMeasurement}</span>
              </div>
            </div>
          </div>

          {/* Vulnerability Trend Chart */}
          <div className="mb-6">
            <VulnerabilityTrendChart metrics={portfolioMetrics} isLoading={isMetricsLoading} />
          </div>

          {/* Severity Callouts Grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <SeverityCallout severity="critical" label="Critical" value={metrics?.critical || 0} />
            <SeverityCallout severity="high" label="High" value={metrics?.high || 0} />
            <SeverityCallout severity="medium" label="Medium" value={metrics?.medium || 0} />
            <SeverityCallout severity="low" label="Low" value={metrics?.low || 0} />
            <SeverityCallout severity="unassigned" label="Unassigned" value={metrics?.unassigned || 0} />
            <SeverityCallout severity="riskScore" label="Risk Score" value={metrics?.inheritedRiskScore || 0} />
          </div>
        </div>
      </Card>

      {/* Component Analysis Section */}
      <div>
        <h3 className="mb-4 text-slate-900">Component Analysis</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Components */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="mb-1 text-sm text-slate-600">Components</div>
                  <div className="text-3xl text-slate-900">{metrics?.components || 0}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">Total number of components in the project</div>
            </div>
          </Card>

          {/* Vulnerable Components */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="mb-1 text-sm text-slate-600">Vulnerable Components</div>
                  <div className="text-3xl text-slate-900">{metrics?.vulnerableComponents || 0}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">Components with known vulnerabilities</div>
            </div>
          </Card>

          {/* Policy Violations */}
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <FileWarning className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="mb-1 text-sm text-slate-600">Policy Violations</div>
                  <div className="text-3xl text-slate-900">{metrics?.policyViolationsTotal || 0}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500">Components violating defined policies</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
