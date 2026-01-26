import { Card, CardContent, CardHeader } from "@/core/components/ui/card";
import { Skeleton } from "@/core/components/ui/skeleton";
import type { TrivyOverviewData } from "../../types";
import { SEVERITY_CONFIG } from "@/modules/platform/security/constants/severity";

/** Type-safe severity count keys that exist on TrivyOverviewData */
type SeverityCountKey = "critical" | "high" | "medium" | "low" | "unknown";

export interface SeverityBreakdownCardProps {
  data: TrivyOverviewData | null;
  isLoading?: boolean;
}

interface SeverityRowProps {
  label: string;
  count: number;
  fixable: number;
  total: number;
  color: string;
}

function SeverityRow({ label, count, fixable, total, color }: SeverityRowProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium">{label}</span>
        </div>
      </td>
      <td className="py-3 text-right font-semibold" style={{ color }}>
        {count.toLocaleString()}
      </td>
      <td className="py-3 text-right">
        <span className="text-muted-foreground text-sm">{fixable.toLocaleString()}</span>
      </td>
      <td className="w-32 py-3 pl-4">
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </td>
      <td className="text-muted-foreground py-3 pl-2 text-right text-sm">{percentage.toFixed(1)}%</td>
    </tr>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-2 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Severity breakdown card with table showing vulnerability counts per severity
 * Includes columns for: Severity, Count, Fixable, Progress bar, Percentage
 */
export function SeverityBreakdownCard({ data, isLoading }: SeverityBreakdownCardProps) {
  const total = data?.totalVulnerabilities ?? 0;

  // Calculate fixable per severity (approximation based on total ratio)
  // In a real scenario, this would need individual tracking per severity
  const fixableRatio = data && total > 0 ? data.fixable / total : 0;

  const severities = SEVERITY_CONFIG.map(({ key, label, color }) => {
    const count = data?.[key as SeverityCountKey] ?? 0;
    return {
      label,
      count,
      fixable: Math.round(count * fixableRatio),
      color,
    };
  });

  const totalFixable = data?.fixable ?? 0;

  return (
    <Card>
      <CardHeader>
        <h4 className="text-lg font-semibold">Severity Breakdown</h4>
        <p className="text-muted-foreground text-sm">Vulnerability distribution by severity level</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs uppercase">
                <th className="pb-2 font-medium">Severity</th>
                <th className="pb-2 text-right font-medium">Count</th>
                <th className="pb-2 text-right font-medium">Fixable</th>
                <th className="pb-2 pl-4 font-medium">Distribution</th>
                <th className="pb-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {severities.map((severity) => (
                <SeverityRow
                  key={severity.label}
                  label={severity.label}
                  count={severity.count}
                  fixable={severity.fixable}
                  total={total}
                  color={severity.color}
                />
              ))}
              <tr className="bg-muted/30 font-semibold">
                <td className="py-3">
                  <span className="font-semibold">Total</span>
                </td>
                <td className="py-3 text-right">{total.toLocaleString()}</td>
                <td className="py-3 text-right">{totalFixable.toLocaleString()}</td>
                <td className="py-3 pl-4">
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div className="bg-primary h-full w-full rounded-full" />
                  </div>
                </td>
                <td className="py-3 text-right">100%</td>
              </tr>
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
