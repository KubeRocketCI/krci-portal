import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { usePipelineActivityChart, ChartDataPoint } from "@/modules/platform/tekton/hooks/usePipelineActivityChart";
import { TimeRange } from "@my-project/shared";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { MAIN_COLOR } from "@/k8s/constants/colors";

/** Chart height in pixels */
const CHART_HEIGHT = 200;
/** Maximum labels to show on x-axis for readability */
const MAX_X_AXIS_LABELS = 12;
/** Threshold for reducing label density */
const LABEL_DENSITY_THRESHOLD = 24;

export interface PipelineActivityChartProps {
  namespace: string;
  timeRange: TimeRange;
  codebase?: string;
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const succeeded = payload.find((p) => p.dataKey === "succeeded")?.value ?? 0;
  const failed = payload.find((p) => p.dataKey === "failed")?.value ?? 0;
  const total = succeeded + failed;

  return (
    <div className="bg-background rounded-lg border p-3 shadow-md">
      <p className="mb-2 font-medium">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Total</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.GREEN }} />
            Succeeded
          </span>
          <span className="font-medium" style={{ color: MAIN_COLOR.GREEN }}>
            {succeeded}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
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

function ChartContent({ data, isLoading }: { data: ChartDataPoint[] | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
        <p className="text-muted-foreground text-sm">No activity data available</p>
      </div>
    );
  }

  const labelInterval = data.length > LABEL_DENSITY_THRESHOLD ? Math.ceil(data.length / MAX_X_AXIS_LABELS) - 1 : 0;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={labelInterval} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }} />
        <Bar dataKey="succeeded" stackId="activity" fill={MAIN_COLOR.GREEN} radius={[2, 2, 0, 0]} />
        <Bar dataKey="failed" stackId="activity" fill={MAIN_COLOR.RED} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PipelineActivityChart({ namespace, timeRange, codebase }: PipelineActivityChartProps) {
  const { data, isLoading, isError } = usePipelineActivityChart(namespace, { timeRange, codebase });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-muted-foreground size-5" />
          <CardTitle className="text-base font-medium">Pipeline Activity</CardTitle>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.GREEN }} />
            <span className="text-muted-foreground">Succeeded</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: MAIN_COLOR.RED }} />
            <span className="text-muted-foreground">Failed</span>
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT }}>
            <p className="text-destructive text-sm">Failed to load activity data</p>
          </div>
        ) : (
          <ChartContent data={data} isLoading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}
