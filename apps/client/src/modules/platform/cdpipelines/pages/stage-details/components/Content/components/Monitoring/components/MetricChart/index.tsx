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

type FlattenedSeries = {
  key: string; // pod name (chart line dataKey + legend label)
  app: string;
  points: Array<{ t: number; v: number }>;
};

function flatten(data: MetricChartProps["data"], selectedApps?: ReadonlySet<string>): FlattenedSeries[] {
  const out: FlattenedSeries[] = [];
  for (const entry of data) {
    if (selectedApps && !selectedApps.has(entry.app)) continue;
    for (const pod of entry.pods) {
      out.push({ key: pod.pod, app: entry.app, points: pod.series });
    }
  }
  return out;
}

function toRechartsRows(flat: FlattenedSeries[]): {
  entries: Array<Record<string, number>>;
  keys: string[];
} {
  const allTs = new Set<number>();
  for (const s of flat) for (const p of s.points) allTs.add(p.t);
  const sortedTs = [...allTs].sort((a, b) => a - b);
  const rowMap = new Map<number, Record<string, number>>();
  for (const t of sortedTs) rowMap.set(t, { t });
  for (const s of flat) {
    for (const p of s.points) {
      rowMap.get(p.t)![s.key] = p.v;
    }
  }
  return { entries: [...rowMap.values()], keys: flat.map((s) => s.key) };
}

export const MetricChart = React.memo(function MetricChart({
  title,
  unit,
  data,
  isLoading,
  error,
  selectedApps,
  step,
  domain,
}: MetricChartProps) {
  const { cursorTs, setCursorTs } = useMetricsCursor();

  const flat = React.useMemo(() => flatten(data, selectedApps), [data, selectedApps]);

  // Stable identity for the current pod set; reset chart-local visibility
  // whenever the underlying pod set changes (e.g. app filter changed) so a
  // previously hidden pod doesn't ghost-suppress a newly arrived pod that
  // happens to share its name.
  const podKey = React.useMemo(
    () =>
      flat
        .map((s) => s.key)
        .sort()
        .join("|"),
    [flat]
  );
  const [hiddenPods, setHiddenPods] = React.useState<ReadonlySet<string>>(() => new Set());
  React.useEffect(() => {
    setHiddenPods(new Set());
  }, [podKey]);

  const visible = React.useMemo(
    () => (hiddenPods.size === 0 ? flat : flat.filter((s) => !hiddenPods.has(s.key))),
    [flat, hiddenPods]
  );

  const { entries, keys } = React.useMemo(() => toRechartsRows(visible), [visible]);
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

  // Colour assignment is computed across ALL pods (regardless of current
  // visibility) so colours stay stable when a pod is hidden via the legend.
  const podColorMap = React.useMemo(() => {
    const map = new Map<string, string>();
    flat.forEach((s, idx) => {
      map.set(s.key, CHART_PALETTE[idx % CHART_PALETTE.length]);
    });
    return map;
  }, [flat]);

  const handleLegendClick = React.useCallback(
    (payload: { value?: string; dataKey?: string }, _index: number, event?: React.MouseEvent) => {
      const pod = payload.value ?? payload.dataKey;
      if (!pod || typeof pod !== "string") return;
      const isolate = !!event && (event.shiftKey || event.metaKey || event.ctrlKey);
      setHiddenPods((prev) => {
        if (isolate) {
          const podKeys = flat.map((s) => s.key);
          // Nothing to isolate when only one pod exists — leave state
          // unchanged so the click is a documented no-op rather than
          // creating a phantom new Set instance that thrashes referential
          // equality downstream.
          if (podKeys.length <= 1) return prev;
          const onlyThisIsVisible = prev.size === podKeys.length - 1 && !prev.has(pod);
          if (onlyThisIsVisible) return new Set(); // already isolated → unisolate
          return new Set(podKeys.filter((p) => p !== pod));
        }
        const next = new Set(prev);
        if (next.has(pod)) next.delete(pod);
        else next.add(pod);
        return next;
      });
    },
    [flat]
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
                domain={domain ?? ["dataMin", "dataMax"]}
                allowDataOverflow={domain !== undefined}
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
                  const pod = typeof name === "string" ? name : String(name ?? "");
                  return [Number.isFinite(v) ? formatValue(unit, v) : "", pod];
                }}
              />
              <Legend
                wrapperStyle={CHART_TEXT.legendWrapper}
                onClick={(payload, index, event) =>
                  handleLegendClick(
                    payload as { value?: string; dataKey?: string },
                    index,
                    event as React.MouseEvent | undefined
                  )
                }
              />
              {keys.map((pod) => (
                <Line
                  key={pod}
                  type="monotone"
                  dataKey={pod}
                  stroke={podColorMap.get(pod) ?? CHART_PALETTE[0]}
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
