import * as React from "react";
import { formatNumber } from "../../../utils/metrics";

/**
 * Base tooltip container with consistent styling
 */
const TooltipContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`border-border/50 rounded-lg border px-2 py-1.5 shadow-lg ${className}`}
    style={{
      backgroundColor: "hsl(var(--background) / 0.95)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}
  >
    {children}
  </div>
);

/**
 * Simple tooltip for single value with optional timestamp
 * Used for sparkline charts and simple line charts
 */
export interface SimpleChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { value: number; timestamp?: number } }>;
}

export function SimpleChartTooltip({ active, payload }: SimpleChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <TooltipContainer>
      <p className="text-foreground text-xs font-semibold">{formatNumber(data.value)}</p>
      {data.timestamp && (
        <p className="text-muted-foreground mt-0.5 text-xs">{new Date(data.timestamp).toLocaleString()}</p>
      )}
    </TooltipContainer>
  );
}

/**
 * Tooltip for charts with timestamp header and labeled value rows with colors
 * Used for charts showing categorized data (e.g., severity levels, violation types)
 */
export interface LabeledValueChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { timestamp: string; [key: string]: number | string } }>;
  labels: Array<{ key: string; label: string; color: string }>;
  valueFormatter?: (key: string, value: number) => string;
}

export function LabeledValueChartTooltip({
  active,
  payload,
  labels,
  valueFormatter = (_, value) => formatNumber(value as number),
}: LabeledValueChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <TooltipContainer className="p-2">
      <p className="text-foreground mb-1.5 text-xs font-medium">{data.timestamp}</p>
      <div className="space-y-0.5">
        {labels.map(({ key, label, color }) => {
          const value = data[key];
          if (value === undefined || value === null) return null;

          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground ml-auto font-medium">{valueFormatter(key, value as number)}</span>
            </div>
          );
        })}
      </div>
    </TooltipContainer>
  );
}
