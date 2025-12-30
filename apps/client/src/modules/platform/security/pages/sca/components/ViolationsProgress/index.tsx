import { Card, CardContent, CardFooter, CardHeader } from "@/core/components/ui/card";
import { PortfolioMetrics } from "@my-project/shared";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { getLatestMetrics, transformToChartData, calculatePercent, formatLastMeasurement } from "../../utils/metrics";
import { MetricProgressBar } from "../shared/MetricProgressBar";
import { LabeledValueChartTooltip } from "../shared/ChartTooltip";
import { STATUS_COLORS, CHART_COLORS, CHART_FILL_OPACITY } from "../../constants/colors";

export interface ViolationsProgressProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

export function ViolationsProgress({ metrics, isLoading }: ViolationsProgressProps) {
  const latestMetrics = getLatestMetrics(metrics);
  const chartData = metrics ? transformToChartData(metrics) : [];

  // Calculate percentages
  const total = latestMetrics?.policyViolationsTotal ?? 0;
  const audited = latestMetrics?.policyViolationsAudited ?? 0;
  const unaudited = latestMetrics?.policyViolationsUnaudited ?? 0;

  const auditedPercent = calculatePercent(total, audited);
  const unauditedPercent = calculatePercent(total, unaudited);

  const lastMeasurement = latestMetrics ? formatLastMeasurement(latestMetrics.lastOccurrence) : "N/A";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">Auditing Progress (Violations)</h4>
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
                      { key: "policyViolationsAudited", label: "Audited", color: STATUS_COLORS.AUDITED },
                      { key: "policyViolationsUnaudited", label: "Unaudited", color: STATUS_COLORS.UNAUDITED },
                    ]}
                  />
                }
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="rect" />
              <Area
                type="monotone"
                dataKey="policyViolationsAudited"
                name="Audited"
                stroke={STATUS_COLORS.AUDITED}
                fill={`${STATUS_COLORS.AUDITED}${CHART_FILL_OPACITY}`}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="policyViolationsUnaudited"
                name="Unaudited"
                stroke={STATUS_COLORS.UNAUDITED}
                fill={`${STATUS_COLORS.UNAUDITED}${CHART_FILL_OPACITY}`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          <MetricProgressBar label="Audited" value={audited} percent={auditedPercent} color={STATUS_COLORS.AUDITED} />
          <MetricProgressBar
            label="Unaudited"
            value={unaudited}
            percent={unauditedPercent}
            color={STATUS_COLORS.UNAUDITED}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
