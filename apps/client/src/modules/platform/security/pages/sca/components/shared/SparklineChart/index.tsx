import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";
import { SimpleChartTooltip } from "../ChartTooltip";

export interface SparklineChartProps {
  data: Array<{ value: number; timestamp?: number }>;
  color: string;
  height?: number;
}

/**
 * Mini sparkline chart for widget cards
 * Shows trend without axes or labels
 */
export function SparklineChart({ data, color, height = 70 }: SparklineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="text-muted-foreground flex items-center justify-center text-xs">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Tooltip content={<SimpleChartTooltip />} cursor={{ stroke: color, strokeWidth: 1 }} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
