import type { ReactNode } from "react";
import { Card, CardContent } from "@/core/components/ui/card";
import { SummaryStat } from "@/modules/platform/security/components/shared/SummaryStat";

interface SummaryStatItem {
  label: string;
  value: number;
  colorClass: string;
}

interface TrivyReportDetailHeaderProps {
  isLoading: boolean;
  isEmpty: boolean;
  icon: React.ElementType;
  title: string;
  titleExtra?: ReactNode;
  metadata?: ReactNode;
  badges?: ReactNode;
  summaryStats: SummaryStatItem[];
}

export function TrivyReportDetailHeader({
  isLoading,
  isEmpty,
  icon: Icon,
  title,
  titleExtra,
  metadata,
  badges,
  summaryStats,
}: TrivyReportDetailHeaderProps) {
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

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">Report not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex flex-1 items-start gap-4">
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded p-3">
              <Icon className="text-primary-foreground h-6 w-6" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{title}</h2>
                {titleExtra}
              </div>

              {metadata && (
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">{metadata}</div>
              )}

              {badges && <div className="flex flex-wrap gap-2">{badges}</div>}
            </div>
          </div>

          <div className="hidden gap-6 md:flex">
            {summaryStats.map((stat) => (
              <SummaryStat key={stat.label} label={stat.label} value={stat.value} colorClass={stat.colorClass} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
