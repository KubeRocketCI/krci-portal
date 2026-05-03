import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { MetricChartProps } from "../../types";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { CHART_PALETTE, CHART_TEXT } from "../../constants";
import { useMetricsCursor } from "../../hooks/useMetricsCursor";
import { chartSlug, formatChartTimestamp, formatValue } from "../../utils";

function toRechartsRows(data: MetricChartProps["data"]): {
  entries: Array<Record<string, number>>;
  keys: string[];
} {
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

export const MetricChart = React.memo(function MetricChart({
  title,
  unit,
  data,
  isLoading,
  error,
  selectedApps,
  onLegendClick,
  step,
}: MetricChartProps) {
  const { cursorTs, setCursorTs } = useMetricsCursor();

  const filtered = React.useMemo(
    () => (selectedApps ? data.filter((s) => selectedApps.has(s.app)) : data),
    [data, selectedApps]
  );

  const { entries, keys } = React.useMemo(() => toRechartsRows(filtered), [filtered]);
  const isEmpty = !isLoading && !error && entries.length === 0;

  const rafRef = React.useRef<number | null>(null);
  const handleMouseMove = React.useCallback(
    (state: { activeLabel?: number | string | null } | null | undefined) => {
      if (!state || state.activeLabel == null) return;
      const raw = typeof state.activeLabel === "number" ? state.activeLabel : Number(state.activeLabel);
      if (Number.isNaN(raw)) return;
      // Bucket to the nearest step boundary so neighbouring pixels in the same
      // step short-circuit the store's identity check (no broadcast).
      const ts = step && step > 0 ? Math.round(raw / step) * step : raw;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setCursorTs(ts));
    },
    [setCursorTs, step]
  );
  const handleMouseLeave = React.useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    setCursorTs(null);
  }, [setCursorTs]);

  React.useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const handleLegendClick = React.useCallback(
    (payload: { value?: string; dataKey?: string }, _index: number, event?: React.MouseEvent) => {
      if (!onLegendClick) return;
      const app = payload.value ?? payload.dataKey;
      if (!app || typeof app !== "string") return;
      const toggle = !!event && (event.shiftKey || event.metaKey || event.ctrlKey);
      onLegendClick(app, { toggle });
    },
    [onLegendClick]
  );

  return (
    <Card className="p-4" data-tour={`stage-monitoring-${chartSlug(title)}`}>
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
          <div className="text-muted-foreground flex h-full items-center justify-center text-3xl font-light tracking-tight">
            No data
          </div>
        )}
        {!isLoading && !error && entries.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={entries} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
              <CartesianGrid {...CHART_TEXT.grid} />
              <XAxis
                dataKey="t"
                tickFormatter={formatChartTimestamp}
                minTickGap={32}
                tick={CHART_TEXT.axisTick}
                axisLine={CHART_TEXT.axisLine}
                tickLine={CHART_TEXT.axisLine}
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
              />
              <YAxis
                tickFormatter={(v: number) => formatValue(unit, v)}
                width={unit === "bytes/s" ? 64 : 56}
                tick={CHART_TEXT.axisTick}
                axisLine={CHART_TEXT.axisLine}
                tickLine={CHART_TEXT.axisLine}
              />
              {cursorTs !== null && (
                <ReferenceLine x={cursorTs} stroke="var(--muted-foreground)" strokeDasharray="2 2" />
              )}
              <Tooltip
                wrapperStyle={CHART_TEXT.tooltipWrapper}
                contentStyle={CHART_TEXT.tooltipContent}
                labelFormatter={(t: number) => formatChartTimestamp(t)}
                formatter={(value, name) => {
                  const v = typeof value === "number" ? value : Number(value);
                  const app = typeof name === "string" ? name : String(name ?? "");
                  return [Number.isFinite(v) ? formatValue(unit, v) : "", app];
                }}
              />
              <Legend
                wrapperStyle={CHART_TEXT.legendWrapper}
                onClick={
                  onLegendClick
                    ? (payload, index, event) =>
                        handleLegendClick(
                          payload as { value?: string; dataKey?: string },
                          index,
                          event as React.MouseEvent | undefined
                        )
                    : undefined
                }
              />
              {keys.map((app, i) => (
                <Line
                  key={app}
                  type="monotone"
                  dataKey={app}
                  stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
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
});
