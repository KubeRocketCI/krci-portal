import { Card, CardContent } from "@/core/components/ui/card";
import { Badge, type BadgeProps } from "@/core/components/ui/badge";
import { usePipelineMetrics } from "@/modules/platform/tekton/hooks/usePipelineMetrics";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { routeOverviewDetails } from "../../route";
import { Activity, TrendingUp, XCircle, Timer, Loader2, type LucideIcon } from "lucide-react";

function formatDuration(duration: string | undefined): string {
  if (!duration) return "-";

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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  badge?: { label: string; variant: BadgeProps["variant"] };
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, iconColor, badge, isLoading }: StatCardProps) {
  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-5" style={{ color: iconColor }} />
          </div>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </div>
        {isLoading ? (
          <div className="flex items-center gap-2 pt-1">
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
            <span className="text-muted-foreground text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <p className="text-foreground mb-1 text-3xl">{value}</p>
            <p className="text-muted-foreground text-sm">{title}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PipelineHealthKPIs() {
  const { namespace } = routeOverviewDetails.useParams();
  const { data, isLoading } = usePipelineMetrics(namespace);

  const total = data?.summary?.total ?? 0;
  const failed = data?.summary?.failed ?? 0;
  const successRate = data?.successRate;
  const avgDuration = formatDuration(data?.summary?.avg_duration);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Pipeline Runs"
        value={total}
        icon={Activity}
        iconColor={MAIN_COLOR.BLUE}
        badge={{ label: "Today", variant: "info" }}
        isLoading={isLoading}
      />
      <StatCard
        title="Success Rate"
        value={successRate != null ? `${successRate}%` : "-"}
        icon={TrendingUp}
        iconColor={MAIN_COLOR.GREEN}
        badge={{ label: `${data?.summary?.succeeded ?? 0} succeeded`, variant: "success" }}
        isLoading={isLoading}
      />
      <StatCard
        title="Failed Pipelines"
        value={failed}
        icon={XCircle}
        iconColor={MAIN_COLOR.RED}
        badge={failed > 0 ? { label: "Attention", variant: "error" } : undefined}
        isLoading={isLoading}
      />
      <StatCard
        title="Average Duration"
        value={avgDuration}
        icon={Timer}
        iconColor={MAIN_COLOR.DARK_PURPLE}
        badge={{ label: "Avg", variant: "neutral" }}
        isLoading={isLoading}
      />
    </div>
  );
}
