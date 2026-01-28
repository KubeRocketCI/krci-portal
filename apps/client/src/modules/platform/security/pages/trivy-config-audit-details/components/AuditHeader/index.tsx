import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { FileWarning } from "lucide-react";
import { ConfigAuditReport, configAuditReportLabels } from "@my-project/shared";
import { SummaryStat } from "@/modules/platform/security/components/shared/SummaryStat";

interface AuditHeaderProps {
  report: ConfigAuditReport | undefined;
  isLoading: boolean;
}

export function AuditHeader({ report, isLoading }: AuditHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-muted h-12 w-12 animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="bg-muted h-6 w-1/3 animate-pulse rounded" />
              <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">Report not found</div>
        </CardContent>
      </Card>
    );
  }

  const summary = report.report.summary;
  const resourceKind = report.metadata?.labels?.[configAuditReportLabels.resourceKind] || "";
  const resourceName = report.metadata?.labels?.[configAuditReportLabels.resourceName] || report.metadata?.name || "";
  const namespace = report.metadata?.namespace || "";
  const scanner = report.report?.scanner;
  const totalChecks = report.report?.checks?.length || 0;
  const failedChecks = report.report?.checks?.filter((check) => !check.success).length || 0;
  const passedChecks = totalChecks - failedChecks;

  const totalIssues = summary.criticalCount + summary.highCount + summary.mediumCount + summary.lowCount;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left section: Report info */}
          <div className="flex flex-1 items-start gap-4">
            {/* Resource Icon */}
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded p-3">
              <FileWarning className="text-primary-foreground h-6 w-6" />
            </div>

            {/* Report Details */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{resourceName}</h2>
                {resourceKind && (
                  <Badge variant="outline" className="text-xs">
                    {resourceKind}
                  </Badge>
                )}
                {totalIssues === 0 && (
                  <Badge variant="default" className="bg-green-500">
                    No Issues
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                {namespace && (
                  <span>
                    Namespace: <span className="text-foreground">{namespace}</span>
                  </span>
                )}
                <span>
                  Checks: <span className="text-foreground">{totalChecks}</span>
                </span>
                <span>
                  Passed: <span className="text-green-600 dark:text-green-400">{passedChecks}</span>
                </span>
                <span>
                  Failed: <span className="text-red-600 dark:text-red-400">{failedChecks}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {scanner?.name && (
                  <Badge variant="secondary" className="text-xs">
                    {scanner.name} {scanner.version && `v${scanner.version}`}
                  </Badge>
                )}
                {report.report?.updateTimestamp && (
                  <Badge variant="secondary" className="text-xs">
                    Last scan: {new Date(report.report.updateTimestamp).toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right section: Severity summary badges */}
          <div className="hidden gap-6 md:flex">
            <SummaryStat label="Critical" value={summary.criticalCount} colorClass="text-red-600 dark:text-red-400" />
            <SummaryStat label="High" value={summary.highCount} colorClass="text-orange-500 dark:text-orange-400" />
            <SummaryStat label="Medium" value={summary.mediumCount} colorClass="text-yellow-500 dark:text-yellow-400" />
            <SummaryStat label="Low" value={summary.lowCount} colorClass="text-blue-500 dark:text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
