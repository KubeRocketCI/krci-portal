import { ThresholdBar } from "@/core/components/ThresholdBar";

interface UsageBarProps {
  label: string;
  value: number;
  max: number;
  format?: (value: number) => string;
  showPercent?: boolean;
}

/** Max 0: an empty bar. */
export function UsageBar({ label, value, max, format = String, showPercent = false }: UsageBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">
          {format(value)} / {format(max)}
          {showPercent && <span className="text-muted-foreground"> ({Math.round(pct)}%)</span>}
        </span>
      </div>
      <ThresholdBar pct={pct} />
    </div>
  );
}
