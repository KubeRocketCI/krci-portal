import { PortfolioMetrics } from "@my-project/shared";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { VIOLATION_COLORS, CHART_COLORS } from "../../../constants/colors";
import { transformToChartData } from "../../../utils/metrics";
import { LabeledValueChartTooltip } from "../ChartTooltip";

export interface PolicyViolationsStateChartProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

export function PolicyViolationsStateChart({ metrics, isLoading }: PolicyViolationsStateChartProps) {
  const chartData = metrics ? transformToChartData(metrics) : [];

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
                { key: "policyViolationsFail", label: "Fail", color: VIOLATION_COLORS.FAIL },
                { key: "policyViolationsWarn", label: "Warn", color: VIOLATION_COLORS.WARN },
                { key: "policyViolationsInfo", label: "Info", color: VIOLATION_COLORS.INFO },
              ]}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
        <Line
          type="monotone"
          dataKey="policyViolationsFail"
          name="Fail"
          stroke={VIOLATION_COLORS.FAIL}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="policyViolationsWarn"
          name="Warn"
          stroke={VIOLATION_COLORS.WARN}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="policyViolationsInfo"
          name="Info"
          stroke={VIOLATION_COLORS.INFO}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
