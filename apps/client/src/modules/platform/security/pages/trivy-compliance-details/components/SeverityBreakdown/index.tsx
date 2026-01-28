import { useMemo } from "react";
import { ControlResult } from "@my-project/shared";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { Card, CardContent } from "@/core/components/ui/card";
import { calculateSeverityCounts } from "../../types";

interface SeverityBreakdownProps {
  controls: ControlResult[];
}

interface SeverityCardProps {
  label: string;
  count: number;
  severity: string;
  failedCount: number;
}

function SeverityCard({ label, count, severity, failedCount }: SeverityCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="mb-1 text-sm font-medium">{label}</div>
        <SeverityCountBadge count={count} severity={severity} showZeroAsBadge />
        <div className="text-muted-foreground mt-2 text-xs">
          {failedCount > 0 ? `${failedCount} failed` : "All passed"}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * SeverityBreakdown component displays a grid of severity counts.
 * Groups controls by severity level (CRITICAL, HIGH, MEDIUM, LOW)
 * and shows total count and failed count for each.
 */
export function SeverityBreakdown({ controls }: SeverityBreakdownProps) {
  const { counts, failedCounts } = useMemo(() => {
    const counts = calculateSeverityCounts(controls);
    const failedCounts = calculateSeverityCounts(controls, (control) => (control.totalFail ?? 0) > 0);

    return { counts, failedCounts };
  }, [controls]);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <SeverityCard label="Critical" count={counts.critical} severity="critical" failedCount={failedCounts.critical} />
      <SeverityCard label="High" count={counts.high} severity="high" failedCount={failedCounts.high} />
      <SeverityCard label="Medium" count={counts.medium} severity="medium" failedCount={failedCounts.medium} />
      <SeverityCard label="Low" count={counts.low} severity="low" failedCount={failedCounts.low} />
    </div>
  );
}
