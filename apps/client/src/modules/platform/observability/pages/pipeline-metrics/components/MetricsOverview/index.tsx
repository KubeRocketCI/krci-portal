import { Card, CardContent } from "@/core/components/ui/card";
import { TektonSummaryItem } from "@my-project/shared";
import { Activity, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { MAIN_COLOR } from "@/k8s/constants/colors";

export interface MetricsOverviewProps {
  summary?: TektonSummaryItem | null;
  successRate?: number | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  valueClassName?: string;
  valueStyle?: React.CSSProperties;
  subtitle?: string;
  isLoading?: boolean;
}

function StatCard({ title, value, icon, valueClassName, valueStyle, subtitle, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
                <span className="text-muted-foreground text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <p className={cn("text-2xl font-bold", valueClassName)} style={valueStyle}>
                  {value}
                </p>
                {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
              </>
            )}
          </div>
          <div className="bg-muted rounded-full p-3">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Format duration string from API (HH:mm:SS.ms) to human-readable format
 */
function formatDuration(duration: string | undefined): string {
  if (!duration) return "-";

  // Parse duration format: "HH:mm:SS.ms" or similar
  const match = duration.match(/(\d+):(\d+):(\d+)/);
  if (!match) return duration;

  const [, hours, minutes, seconds] = match;
  const h = parseInt(hours, 10);
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function MetricsOverview({ summary, successRate, isLoading }: MetricsOverviewProps) {
  const total = summary?.total ?? 0;
  const succeeded = summary?.succeeded ?? 0;
  const failed = summary?.failed ?? 0;
  const avgDuration = formatDuration(summary?.avg_duration);
  const minDuration = formatDuration(summary?.min_duration);
  const maxDuration = formatDuration(summary?.max_duration);
  const durationRange = minDuration !== "-" && maxDuration !== "-" ? `${minDuration} — ${maxDuration}` : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Runs"
        value={total}
        icon={<Activity className="text-primary size-6" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Success Rate"
        value={successRate !== null ? `${successRate}%` : "-"}
        subtitle={`${succeeded} succeeded`}
        icon={<CheckCircle2 className="size-6" style={{ color: MAIN_COLOR.GREEN }} />}
        valueStyle={{ color: MAIN_COLOR.GREEN }}
        isLoading={isLoading}
      />
      <StatCard
        title="Failed"
        value={failed}
        subtitle={failed > 0 ? "Needs attention" : "All green"}
        icon={<XCircle className="size-6" style={{ color: MAIN_COLOR.RED }} />}
        valueStyle={failed > 0 ? { color: MAIN_COLOR.RED } : undefined}
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Duration"
        value={avgDuration}
        subtitle={durationRange}
        icon={<Clock className="text-primary size-6" />}
        isLoading={isLoading}
      />
    </div>
  );
}
