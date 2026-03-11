import { Card, CardContent } from "@/core/components/ui/card";
import { usePipelineActivityChart } from "@/modules/platform/tekton/hooks/usePipelineActivityChart";
import { TIME_RANGES } from "@my-project/shared";
import { MAIN_COLOR } from "@/k8s/constants/colors";
import { routeOverviewDetails } from "../../route";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

const CHART_HEIGHT = 160;

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const succeeded = payload.find((p) => p.dataKey === "succeeded")?.value ?? 0;
  const failed = payload.find((p) => p.dataKey === "failed")?.value ?? 0;

  return (
    <div className="bg-background rounded-lg border p-2.5 shadow-md">
      <p className="text-foreground mb-1.5 text-xs font-medium">{label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.GREEN }} />
            Succeeded
          </span>
          <span className="font-medium" style={{ color: MAIN_COLOR.GREEN }}>
            {succeeded}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.RED }} />
            Failed
          </span>
          <span className="font-medium" style={{ color: MAIN_COLOR.RED }}>
            {failed}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PipelineActivityTrend() {
  const { namespace } = routeOverviewDetails.useParams();
  const { data, isLoading, isError } = usePipelineActivityChart(namespace, {
    timeRange: TIME_RANGES.WEEK,
  });

  return (
    <Card className="border">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4" style={{ color: MAIN_COLOR.BLUE }} />
            <h2 className="text-foreground text-base font-medium">Pipeline Activity (7 days)</h2>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.GREEN }} />
              <span className="text-muted-foreground">Succeeded</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.RED }} />
              <span className="text-muted-foreground">Failed</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
            <Loader2 className="text-muted-foreground size-5 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
            <p className="text-destructive text-sm">Failed to load activity data</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
            <p className="text-muted-foreground text-sm">No activity data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
              <Bar dataKey="succeeded" stackId="activity" fill={MAIN_COLOR.GREEN} radius={[2, 2, 0, 0]} />
              <Bar dataKey="failed" stackId="activity" fill={MAIN_COLOR.RED} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
