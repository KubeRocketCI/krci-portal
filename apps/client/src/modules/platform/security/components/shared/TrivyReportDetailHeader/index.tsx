import type { ReactNode } from "react";
import { SummaryStat } from "@/modules/platform/security/components/shared/SummaryStat";

interface SummaryStatItem {
  label: string;
  value: number;
  colorClass: string;
}

interface TrivyReportDetailHeaderProps {
  isLoading: boolean;
  isEmpty: boolean;
  metadata?: ReactNode;
  badges?: ReactNode;
  summaryStats: SummaryStatItem[];
}

export function TrivyReportDetailHeader({
  isLoading,
  isEmpty,
  metadata,
  badges,
  summaryStats,
}: TrivyReportDetailHeaderProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
      </div>
    );
  }

  if (isEmpty) {
    return <div className="text-muted-foreground py-2 text-center">Report not found</div>;
  }

  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <div className="flex-1 space-y-2">
        {metadata && <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">{metadata}</div>}

        {badges && <div className="flex flex-wrap gap-2">{badges}</div>}
      </div>

      <div className="hidden gap-6 md:flex">
        {summaryStats.map((stat) => (
          <SummaryStat key={stat.label} label={stat.label} value={stat.value} colorClass={stat.colorClass} />
        ))}
      </div>
    </div>
  );
}
