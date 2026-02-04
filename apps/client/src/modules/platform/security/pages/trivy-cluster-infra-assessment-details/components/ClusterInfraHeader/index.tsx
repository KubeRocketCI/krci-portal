import { Badge } from "@/core/components/ui/badge";
import { Server } from "lucide-react";
import { ClusterInfraAssessmentReport } from "@my-project/shared";
import { TrivyReportDetailHeader } from "@/modules/platform/security/components/shared/TrivyReportDetailHeader";
import { getAuditSummaryStats } from "@/modules/platform/security/components/shared/TrivyReportDetailHeader/utils";

interface ClusterInfraHeaderProps {
  report: ClusterInfraAssessmentReport | undefined;
  isLoading: boolean;
}

export function ClusterInfraHeader({ report, isLoading }: ClusterInfraHeaderProps) {
  const summary = report?.report.summary;
  const resourceName = report?.metadata?.name || "";
  const scanner = report?.report?.scanner;
  const totalChecks = report?.report?.checks?.length || 0;
  const failedChecks = report?.report?.checks?.filter((check) => !check.success).length || 0;
  const passedChecks = totalChecks - failedChecks;
  const totalIssues = summary ? summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount : 0;

  return (
    <TrivyReportDetailHeader
      isLoading={isLoading}
      isEmpty={!report}
      icon={Server}
      title={resourceName}
      titleExtra={
        <>
          <Badge variant="outline" className="text-xs">
            Cluster
          </Badge>
          {totalIssues === 0 && summary && (
            <Badge variant="default" className="bg-green-500">
              No Issues
            </Badge>
          )}
        </>
      }
      metadata={
        <>
          <span>
            Scope: <span className="text-foreground">Cluster</span>
          </span>
          <span>
            Checks: <span className="text-foreground">{totalChecks}</span>
          </span>
          <span>
            Passed: <span className="text-green-600 dark:text-green-400">{passedChecks}</span>
          </span>
          <span>
            Failed: <span className="text-red-600 dark:text-red-400">{failedChecks}</span>
          </span>
        </>
      }
      badges={
        scanner?.name ? (
          <Badge variant="secondary" className="text-xs">
            {scanner.name} {scanner.version && `v${scanner.version}`}
          </Badge>
        ) : undefined
      }
      summaryStats={summary ? getAuditSummaryStats(summary) : []}
    />
  );
}
