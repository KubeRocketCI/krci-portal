import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { MetricChartProps } from "../../types";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#a855f7", "#84cc16"];

function formatValue(unit: MetricChartProps["unit"], v: number): string {
  if (unit === "cores") return v.toFixed(2);
  if (unit === "MiB") return Math.round(v / (1024 * 1024)).toString();
  return Math.round(v).toString();
}

function formatTimestamp(t: number): string {
  return new Date(t * 1000).toLocaleTimeString();
}

/**
 * Recharts expects a single data array with one row per timestamp and one
 * column per series. We merge the per-app series into that wide form.
 */
function toRechartsRows(data: MetricChartProps["data"]): { entries: Array<Record<string, number>>; keys: string[] } {
  const allTs = new Set<number>();
  for (const s of data) for (const p of s.series) allTs.add(p.t);
  const sortedTs = [...allTs].sort((a, b) => a - b);
  const rowMap = new Map<number, Record<string, number>>();
  for (const t of sortedTs) rowMap.set(t, { t });
  for (const s of data) {
    for (const p of s.series) {
      rowMap.get(p.t)![s.app] = p.v;
    }
  }
  return { entries: [...rowMap.values()], keys: data.map((s) => s.app) };
}

export const MetricChart: React.FC<MetricChartProps> = ({ title, unit, data, isLoading, error }) => {
  const { entries, keys } = React.useMemo(() => toRechartsRows(data), [data]);
  const isEmpty = !isLoading && !error && entries.length === 0;

  return (
    <Card className="p-4" data-tour={`stage-monitoring-${unit}`}>
      <div className="flex items-baseline justify-between">
        <h4 className="text-foreground text-base font-semibold">{title}</h4>
        <span className="text-muted-foreground text-xs">{unit}</span>
      </div>
      <div className="mt-3 h-64 w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        )}
        {!isLoading && error && (
          <div className="text-destructive flex h-full items-center justify-center text-sm">{error.message}</div>
        )}
        {isEmpty && (
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            No data in selected time range
          </div>
        )}
        {!isLoading && !error && entries.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={entries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={formatTimestamp} minTickGap={32} />
              <YAxis tickFormatter={(v: number) => formatValue(unit, v)} width={48} />
              <Tooltip
                labelFormatter={(t: number) => formatTimestamp(t)}
                formatter={(v: number | undefined, app: string | undefined) => [
                  v !== undefined ? formatValue(unit, v) : "",
                  app ?? "",
                ]}
              />
              <Legend />
              {keys.map((app, i) => (
                <Line
                  key={app}
                  type="monotone"
                  dataKey={app}
                  stroke={PALETTE[i % PALETTE.length]}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
