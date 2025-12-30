import { Card, CardContent, CardFooter, CardHeader } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { getLatestMetrics, transformToChartData, calculatePercent, formatLastMeasurement } from "../../utils/metrics";
import { MetricProgressBar } from "../shared/MetricProgressBar";
import { LabeledValueChartTooltip } from "../shared/ChartTooltip";
import { STATUS_COLORS, CHART_COLORS, CHART_FILL_OPACITY } from "../../constants/colors";

export interface ProjectsChartProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

export function ProjectsChart({ metrics, isLoading }: ProjectsChartProps) {
  const latestMetrics = useMemo(() => getLatestMetrics(metrics), [metrics]);

  const chartData = useMemo(
    () =>
      metrics
        ? transformToChartData(metrics).map((m) => ({
            ...m,
            total: m.projects,
            nonVulnerable: m.projects - m.vulnerableProjects,
            vulnerable: m.vulnerableProjects,
          }))
        : [],
    [metrics]
  );

  const total = latestMetrics?.projects ?? 0;
  const vulnerable = latestMetrics?.vulnerableProjects ?? 0;
  const nonVulnerable = total - vulnerable;

  const vulnerablePercent = calculatePercent(total, vulnerable);
  const nonVulnerablePercent = calculatePercent(total, nonVulnerable);

  const lastMeasurement = latestMetrics ? formatLastMeasurement(latestMetrics.lastOccurrence) : "N/A";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">Projects</h4>
            <p className="text-muted-foreground text-sm">Last measurement: {lastMeasurement}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-[200px] items-center justify-center">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
              <YAxis tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
              <Tooltip
                content={
                  <LabeledValueChartTooltip
                    labels={[
                      { key: "total", label: "Total", color: CHART_COLORS.TOTAL_LINE },
                      { key: "nonVulnerable", label: "Non-Vulnerable", color: STATUS_COLORS.PASSED },
                      { key: "vulnerable", label: "Vulnerable", color: STATUS_COLORS.WARNING },
                    ]}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="rect" />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke={CHART_COLORS.TOTAL_LINE}
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="nonVulnerable"
                name="Non-Vulnerable"
                stackId="1"
                stroke={STATUS_COLORS.PASSED}
                fill={`${STATUS_COLORS.PASSED}${CHART_FILL_OPACITY}`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="vulnerable"
                name="Vulnerable"
                stackId="1"
                stroke={STATUS_COLORS.WARNING}
                fill={`${STATUS_COLORS.WARNING}${CHART_FILL_OPACITY}`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          <MetricProgressBar
            label="Non-Vulnerable"
            value={nonVulnerable}
            percent={nonVulnerablePercent}
            color={STATUS_COLORS.PASSED}
          />
          <MetricProgressBar
            label="Vulnerable"
            value={vulnerable}
            percent={vulnerablePercent}
            color={STATUS_COLORS.WARNING}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
