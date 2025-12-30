import { PortfolioMetrics } from "@my-project/shared";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { CHART_COLORS, VIOLATION_COLORS, STATUS_COLORS } from "../../../sca/constants/colors";
import { formatChartTimestamp } from "../../../sca/utils/metrics";
import { LabeledValueChartTooltip } from "../../../sca/components/shared/ChartTooltip";

export interface ComponentsChartProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

/**
 * Transform metrics to include non-vulnerable components calculation
 */
function transformComponentsData(metrics: PortfolioMetrics[]) {
  return metrics.map((m) => ({
    timestamp: formatChartTimestamp(m.firstOccurrence),
    date: m.firstOccurrence,
    components: m.components,
    vulnerableComponents: m.vulnerableComponents,
    nonVulnerableComponents: m.components - m.vulnerableComponents,
  }));
}

export function ComponentsChart({ metrics, isLoading }: ComponentsChartProps) {
  const chartData = metrics ? transformComponentsData(metrics) : [];

  if (isLoading) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return <div className="text-muted-foreground flex h-[200px] items-center justify-center">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
        <YAxis tick={{ fontSize: 12 }} stroke={CHART_COLORS.AXIS_STROKE} />
        <Tooltip
          content={
            <LabeledValueChartTooltip
              labels={[
                { key: "components", label: "Total", color: CHART_COLORS.TOTAL_LINE },
                { key: "vulnerableComponents", label: "Vulnerable", color: VIOLATION_COLORS.WARN },
                { key: "nonVulnerableComponents", label: "Non-Vulnerable", color: STATUS_COLORS.PASSED },
              ]}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
        <Line
          type="monotone"
          dataKey="components"
          name="Total"
          stroke={CHART_COLORS.TOTAL_LINE}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="vulnerableComponents"
          name="Vulnerable"
          stroke={VIOLATION_COLORS.WARN}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="nonVulnerableComponents"
          name="Non-Vulnerable"
          stroke={STATUS_COLORS.PASSED}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
