import { Alert, AlertDescription } from "@/core/components/ui/alert";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { PATH_CONFIG_SONAR_FULL } from "@/modules/platform/configuration/modules/sonar/route";
import { PATH_SAST_PROJECT_DETAILS_FULL } from "@/modules/platform/security/pages/sast-project-details/route";
import { MetricsGrid } from "@/modules/platform/security/pages/sast-project-details/components/MetricsGrid";
import { SonarQubeMetricsList } from "@/modules/platform/security/components/sonarqube/SonarQubeMetricsList";
import { useProject } from "@/modules/platform/security/pages/sast-project-details/hooks/useProject";
import { SecurityTabProps } from "./types";
import { useClusterStore } from "@/k8s/store";

const getStatusColor = (status: string | undefined) => {
  return status === "OK" ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300";
};

/**
 * Security Tab component for Codebase Details page
 */
export function SecurityTab({ codebaseName, namespace, clusterName }: SecurityTabProps) {
  const { data: project, isLoading } = useProject(codebaseName);
  const sonarBaseUrl = useClusterStore((state) => state.sonarWebUrl);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <Alert>
        <AlertDescription>
          No SonarQube data available for this project.{" "}
          <Link to={PATH_CONFIG_SONAR_FULL} params={{ clusterName }} className="hover:text-foreground underline">
            Configure SonarQube integration
          </Link>{" "}
          and enable reporting in your pipeline to view code quality metrics.
        </AlertDescription>
      </Alert>
    );
  }

  const measures = project.measures;
  const qualityGateStatus = measures?.alert_status;

  return (
    <div className="space-y-6">
      {/* Quick Metrics Card */}
      <Card className="p-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-muted-foreground h-5 w-5" />
            <h4 className="text-foreground">Code Quality</h4>
          </div>
          <Badge variant="outline" className={getStatusColor(qualityGateStatus)}>
            {qualityGateStatus === "OK" ? "Passed" : "Failed"}
          </Badge>

          <SonarQubeMetricsList measures={measures} sonarBaseUrl={sonarBaseUrl} projectKey={project.key} />

          <div className="ml-auto">
            <Button asChild variant="outline">
              <Link to={PATH_SAST_PROJECT_DETAILS_FULL} params={{ clusterName, namespace, projectKey: project.key }}>
                Open Details Page
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Metrics Grid (4x2) */}
      <MetricsGrid project={project} isLoading={false} />
    </div>
  );
}
