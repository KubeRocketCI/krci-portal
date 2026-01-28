import { Card, CardContent } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Progress } from "@/core/components/ui/progress";
import { ClusterComplianceReport } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { ExternalLink, Shield, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/core/components/ui/skeleton";
import {
  getComplianceTypeBadgeClasses,
  getPassRateColorClass,
  getPassRateProgressClass,
} from "../../../trivy-compliance/types";
import { SummaryStat } from "@/modules/platform/security/components/shared/SummaryStat";

interface ComplianceHeaderProps {
  report: ClusterComplianceReport | undefined;
  isLoading: boolean;
}

export function ComplianceHeader({ report, isLoading }: ComplianceHeaderProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
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

  const compliance = report.spec.compliance;
  const summary = report.status?.summary;
  const passCount = summary?.passCount ?? 0;
  const failCount = summary?.failCount ?? 0;
  const total = passCount + failCount;
  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;
  const relatedResources = compliance.relatedResources ?? [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left section: Report info */}
          <div className="flex flex-1 items-start gap-4">
            {/* Shield Icon */}
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded p-3">
              <Shield className="text-primary-foreground h-6 w-6" />
            </div>

            {/* Report Details */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{compliance.title}</h2>
              </div>

              {compliance.description && <p className="text-muted-foreground text-sm">{compliance.description}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase",
                    getComplianceTypeBadgeClasses(compliance.type)
                  )}
                >
                  {compliance.type}
                </span>
                {compliance.version && (
                  <Badge variant="secondary" className="text-xs">
                    v{compliance.version}
                  </Badge>
                )}
                {compliance.platform && (
                  <Badge variant="outline" className="text-xs">
                    {compliance.platform}
                  </Badge>
                )}
              </div>

              {/* Progress bar for pass rate */}
              <div className="max-w-md space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pass Rate</span>
                  <span className={cn("font-medium", getPassRateColorClass(passRate))}>{passRate}%</span>
                </div>
                <Progress value={passRate} className={cn("h-2", getPassRateProgressClass(passRate))} />
              </div>

              {/* Related resources links */}
              {relatedResources.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {relatedResources.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {new URL(url).hostname}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right section: Summary stats */}
          <div className="hidden gap-8 md:flex">
            <SummaryStat
              icon={CheckCircle}
              label="Passed"
              value={passCount}
              colorClass="text-green-600 dark:text-green-400"
            />
            <SummaryStat
              icon={XCircle}
              label="Failed"
              value={failCount}
              colorClass={failCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
