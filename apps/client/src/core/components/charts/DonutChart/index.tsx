import type { ReactNode } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/core/utils/classname";
import { Skeleton } from "@/core/components/ui/skeleton";

/** Empty-ring colour. Not a status colour. */
const EMPTY_RING_COLOR = "var(--border)";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
  // recharts v3 data rows must be index-signature compatible
  [key: string]: string | number;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  /** Smaller text scale for small rings. */
  centerValueClassName?: string;
}

/** Zero total renders one neutral ring. */
export function DonutChart({
  data,
  size = 116,
  thickness = 14,
  centerValue,
  centerLabel,
  centerValueClassName = "text-xl",
}: DonutChartProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const slices: DonutSlice[] =
    total > 0 ? data.filter((slice) => slice.value > 0) : [{ name: "None", value: 1, color: EMPTY_RING_COLOR }];

  const outerRadius = size / 2;
  const innerRadius = outerRadius - thickness;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={total > 0 ? 2 : 0}
          stroke="none"
          isAnimationActive={false}
        >
          {slices.map((slice, index) => (
            <Cell key={`cell-${index}`} fill={slice.color} />
          ))}
        </Pie>
      </PieChart>
      {(centerValue != null || centerLabel != null) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {centerValue != null && (
            <span className={cn("text-foreground leading-none font-semibold tabular-nums", centerValueClassName)}>
              {centerValue}
            </span>
          )}
          {centerLabel != null && (
            <span className="text-muted-foreground mt-0.5 text-[10px] tracking-wide uppercase">{centerLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Inherits the surface colour. Renders inside the inverted tooltip. */
export function DonutLegend({ slices }: { slices: DonutSlice[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {slices.map((slice, index) => (
        <li key={`${slice.name}-${index}`} className="flex items-center gap-1.5 text-xs">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-current/20 ring-inset"
            style={{ backgroundColor: slice.color }}
            aria-hidden
          />
          <span className="truncate opacity-70">{slice.name}</span>
          <span className="ml-auto tabular-nums">{slice.value}</span>
        </li>
      ))}
    </ul>
  );
}

interface DonutCardBodyProps {
  slices: DonutSlice[];
  isLoading: boolean;
  size: number;
  thickness: number;
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  emptyText: string;
}

export function DonutCardBody({
  slices,
  isLoading,
  size,
  thickness,
  centerValue,
  centerLabel,
  emptyText,
}: DonutCardBodyProps) {
  return (
    <>
      <DonutChart data={slices} size={size} thickness={thickness} centerValue={centerValue} centerLabel={centerLabel} />
      <div className="min-w-0 flex-1">
        {isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : slices.length > 0 ? (
          <DonutLegend slices={slices} />
        ) : (
          <span className="text-muted-foreground text-xs">{emptyText}</span>
        )}
      </div>
    </>
  );
}
