import { PortfolioMetrics } from "@my-project/shared";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { CHART_COLORS, STATUS_COLORS } from "../../../sca/constants/colors";
import { transformToChartData } from "../../../sca/utils/metrics";
import { LabeledValueChartTooltip } from "../../../sca/components/shared/ChartTooltip";

export interface AuditingProgressChartProps {
  metrics: PortfolioMetrics[] | undefined;
  isLoading?: boolean;
}

export function AuditingProgressChart({ metrics, isLoading }: AuditingProgressChartProps) {
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
                { key: "findingsTotal", label: "Total Findings", color: CHART_COLORS.TOTAL_LINE },
                { key: "findingsAudited", label: "Audited", color: STATUS_COLORS.AUDITED },
                { key: "findingsUnaudited", label: "Unaudited", color: STATUS_COLORS.UNAUDITED },
              ]}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
        <Line
          type="monotone"
          dataKey="findingsTotal"
          name="Total Findings"
          stroke={CHART_COLORS.TOTAL_LINE}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="findingsAudited"
          name="Audited"
          stroke={STATUS_COLORS.AUDITED}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="findingsUnaudited"
          name="Unaudited"
          stroke={STATUS_COLORS.UNAUDITED}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
